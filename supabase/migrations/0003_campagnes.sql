-- Calypso Advisory : demandes issues des pages de campagne (SMS) et oppositions
-- Migration ADDITIVE : aucune colonne retirée, la fonction submit_demande du site n'est pas modifiée.
-- Seul assouplissement : l'e-mail devient facultatif dans la table (une demande de campagne
-- arrive avec un téléphone, pas forcément un e-mail). submit_demande continue de l'exiger.

alter table public.demandes alter column email drop not null;

alter table public.demandes
  add column if not exists origine     text not null default 'site',
  add column if not exists campagne    text,
  add column if not exists landing     text,
  add column if not exists siren       text,
  add column if not exists attribution jsonb,
  add column if not exists est_test    boolean not null default false;

create index if not exists demandes_campagne_idx on public.demandes (campagne, created_at desc);
create index if not exists demandes_telephone_idx on public.demandes (telephone, created_at desc);

-- Dépôt d'une demande depuis une page de campagne : téléphone obligatoire (format +33XXXXXXXXX),
-- e-mail facultatif. Même logique que submit_demande : contrôles et garde anti-envois dans la base.
create or replace function public.submit_demande_campagne(
  p_nom text, p_telephone text, p_email text default null, p_societe text default null, p_siren text default null,
  p_situation text default null, p_message text default null, p_campagne text default null, p_landing text default null,
  p_attribution jsonb default null, p_test boolean default false, p_user_agent text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_nom text := trim(coalesce(p_nom, ''));
  v_tel text := trim(coalesce(p_telephone, ''));
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_siren text := nullif(trim(coalesce(p_siren, '')), '');
  v_id uuid;
begin
  if v_nom = '' or length(v_nom) > 160 then raise exception 'invalid' using errcode = '22023'; end if;
  if v_tel !~ '^\+33[1-9][0-9]{8}$' then raise exception 'invalid' using errcode = '22023'; end if;
  if v_email is not null and (v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(v_email) > 200) then raise exception 'invalid' using errcode = '22023'; end if;
  if v_siren is not null and v_siren !~ '^[0-9]{9}$' then v_siren := null; end if;
  if p_situation is not null and p_situation not in ('Anticiper','Trésorerie','Créanciers','Négociation','Procédure envisagée','Sauvegarde ou redressement','Échéance','Cession','Autre') then p_situation := null; end if;
  if p_attribution is not null and length(p_attribution::text) > 4000 then p_attribution := null; end if;
  if (select count(*) from public.demandes d where d.telephone = v_tel and d.created_at > now() - interval '10 minutes') >= 3 then
    return null;
  end if;
  insert into public.demandes (nom, email, societe, telephone, situation, message, user_agent, origine, campagne, landing, siren, attribution, est_test)
  values (v_nom, v_email, nullif(left(trim(coalesce(p_societe, '')), 200), ''), v_tel, p_situation,
          nullif(left(coalesce(p_message, ''), 5000), ''), left(p_user_agent, 300),
          'campagne', nullif(left(coalesce(p_campagne, ''), 60), ''), nullif(left(coalesce(p_landing, ''), 60), ''),
          v_siren, p_attribution, coalesce(p_test, false))
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.submit_demande_campagne(text, text, text, text, text, text, text, text, text, jsonb, boolean, text) from public;
grant execute on function public.submit_demande_campagne(text, text, text, text, text, text, text, text, text, jsonb, boolean, text) to anon, authenticated;

-- Oppositions : numéros qui ne veulent plus recevoir de message
create table if not exists public.oppositions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  telephone   text not null,
  societe     text,
  landing     text,
  user_agent  text
);
create index if not exists oppositions_telephone_idx on public.oppositions (telephone);
alter table public.oppositions enable row level security;
create policy oppositions_admin_select on public.oppositions for select to authenticated using (public.is_admin());
create policy oppositions_admin_delete on public.oppositions for delete to authenticated using (public.is_admin());
revoke insert, update, delete, select on public.oppositions from anon;
revoke insert, update on public.oppositions from authenticated;

create or replace function public.submit_opposition(
  p_telephone text, p_societe text default null, p_landing text default null, p_user_agent text default null
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_tel text := trim(coalesce(p_telephone, ''));
begin
  if v_tel !~ '^\+33[1-9][0-9]{8}$' then raise exception 'invalid' using errcode = '22023'; end if;
  if exists (select 1 from public.oppositions o where o.telephone = v_tel) then return true; end if;
  if (select count(*) from public.oppositions o where o.created_at > now() - interval '1 minute') >= 30 then return false; end if;
  insert into public.oppositions (telephone, societe, landing, user_agent)
  values (v_tel, nullif(left(trim(coalesce(p_societe, '')), 200), ''), nullif(left(coalesce(p_landing, ''), 60), ''), left(p_user_agent, 300));
  return true;
end $$;
revoke all on function public.submit_opposition(text, text, text, text) from public;
grant execute on function public.submit_opposition(text, text, text, text) to anon, authenticated;
