-- Calypso Advisory : demandes reçues par le formulaire « Faire le point »
create extension if not exists pgcrypto;

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

-- Sécurité : RLS activée, aucune politique publique.
-- Personne ne peut lire ou écrire avec la clé publique ; seul le serveur du site (clé service_role) y accède.
alter table public.demandes enable row level security;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists demandes_touch on public.demandes;
create trigger demandes_touch before update on public.demandes for each row execute function public.touch_updated_at();
