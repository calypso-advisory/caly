-- Calypso Advisory : demandes reçues par le formulaire « Faire le point »
-- (appliquée au projet Supabase « Calypso Project » le 30/09/2026)
create table if not exists public.demandes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  situation   text,
  message     text,
  nom         text not null,
  societe     text,
  email       text not null,
  telephone   text,
  statut      text not null default 'nouveau' check (statut in ('nouveau', 'en_cours', 'traite', 'archive')),
  notes       text,
  user_agent  text
);
create index if not exists demandes_created_at_idx on public.demandes (created_at desc);
create index if not exists demandes_statut_idx on public.demandes (statut);
create index if not exists demandes_email_idx on public.demandes (email, created_at desc);

-- Comptes autorisés à lire les demandes (tableau de bord)
create table if not exists public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.demandes enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

create policy demandes_admin_select on public.demandes for select to authenticated using (public.is_admin());
create policy demandes_admin_update on public.demandes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy demandes_admin_delete on public.demandes for delete to authenticated using (public.is_admin());
create policy admins_self_read on public.admins for select to authenticated using (public.is_admin());

-- Le site public n'a aucun accès direct à la table : le formulaire passe par submit_demande
revoke insert, update, delete, select on public.demandes from anon;
revoke insert on public.demandes from authenticated;

create or replace function public.submit_demande(
  p_nom text, p_email text, p_societe text default null, p_telephone text default null,
  p_situation text default null, p_message text default null, p_user_agent text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_nom text := trim(coalesce(p_nom, ''));
  v_id uuid;
begin
  if v_nom = '' or length(v_nom) > 160 then raise exception 'invalid' using errcode = '22023'; end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(v_email) > 200 then raise exception 'invalid' using errcode = '22023'; end if;
  if p_situation is not null and p_situation not in ('Anticiper','Trésorerie','Créanciers','Négociation','Procédure envisagée','Sauvegarde ou redressement','Échéance','Cession','Autre') then p_situation := null; end if;
  if (select count(*) from public.demandes d where d.email = v_email and d.created_at > now() - interval '10 minutes') >= 3 then
    return null;
  end if;
  insert into public.demandes (nom, email, societe, telephone, situation, message, user_agent)
  values (v_nom, v_email, nullif(left(trim(coalesce(p_societe, '')), 200), ''), nullif(left(trim(coalesce(p_telephone, '')), 40), ''),
          p_situation, nullif(left(coalesce(p_message, ''), 5000), ''), left(p_user_agent, 300))
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.submit_demande(text, text, text, text, text, text, text) from public;
grant execute on function public.submit_demande(text, text, text, text, text, text, text) to anon, authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists demandes_touch on public.demandes;
create trigger demandes_touch before update on public.demandes for each row execute function public.touch_updated_at();

-- Ajouter un administrateur :  insert into public.admins (email) values ('prenom@domaine.fr');
