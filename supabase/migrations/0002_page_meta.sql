-- Métadonnées éditables par page et images de partage (à appliquer après 0001)
create table if not exists public.page_meta (
  page_id        text primary key check (page_id in ('accueil','audits','cockpit','approche','professionnels','cabinet','faire-le-point','mentions')),
  title          text check (char_length(title) <= 120),
  description    text check (char_length(description) <= 320),
  og_title       text check (char_length(og_title) <= 120),
  og_description text check (char_length(og_description) <= 320),
  og_image_url   text check (char_length(og_image_url) <= 600),
  noindex        boolean not null default false,
  updated_at     timestamptz not null default now(),
  updated_by     text
);
alter table public.page_meta enable row level security;
create policy page_meta_public_read on public.page_meta for select to anon, authenticated using (true);
create policy page_meta_admin_insert on public.page_meta for insert to authenticated with check (public.is_admin());
create policy page_meta_admin_update on public.page_meta for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy page_meta_admin_delete on public.page_meta for delete to authenticated using (public.is_admin());
revoke insert, update, delete on public.page_meta from anon;
drop trigger if exists page_meta_touch on public.page_meta;
create trigger page_meta_touch before update on public.page_meta for each row execute function public.touch_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site', 'site', true, 4194304, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy site_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'site' and public.is_admin());
create policy site_admin_update on storage.objects for update to authenticated using (bucket_id = 'site' and public.is_admin()) with check (bucket_id = 'site' and public.is_admin());
create policy site_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'site' and public.is_admin());
