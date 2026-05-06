-- Adds: 1) `image` column on categories (so admins can upload a photo
--           instead of relying on emoji),
--       2) public `media` Storage bucket (where uploaded photos are stored),
--       3) public-read RLS policy on storage.objects for that bucket.
--
-- Run this in Supabase SQL Editor AFTER 0002_catalog_schema.sql.
-- It is idempotent — safe to re-run.

-- 1) Optional image URL on categories.
alter table public.categories add column if not exists image text;

-- 2) Public bucket `media` (already public so client <img src> works).
insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do update set public = excluded.public;

-- 3) Anyone can read objects from `media`.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'media public read'
  ) then
    create policy "media public read"
      on storage.objects for select
      to public
      using (bucket_id = 'media');
  end if;
end$$;
