-- Phase 3.3: MediaUploader storage support.
--
-- Adds folders to the existing public `media` bucket for vendor self-service
-- uploads (logos, banners, gallery photos for storefronts) and creates a
-- separate **private** `vkusnomarket-docs` bucket for sensitive documents
-- (vendor licenses, courier passports / ID / med books).
--
-- The public `media` bucket already exists (see 0003_media_and_category_image.sql).
-- We only need to ensure the policies cover the new folder prefixes
-- (`vendors/`, `couriers/avatars/`). Storage objects RLS for `media` is already
-- "anyone can read" + "service_role can write", which is fine — uploads always
-- go through server actions using the service-role key after the action checks
-- the vendor/courier session cookie.
--
-- For `vkusnomarket-docs` we make the bucket private and rely on signed URLs.
-- Public role gets NO access. Service-role bypasses RLS as always, so server
-- actions can still issue signed URLs.
--
-- Run after 0006_rename_to_vkusmarket.sql. Idempotent.

-- 1) Private bucket for sensitive documents.
insert into storage.buckets (id, name, public)
  values ('vkusnomarket-docs', 'vkusnomarket-docs', false)
  on conflict (id) do update set public = excluded.public;

-- 2) Deny-all policies on the private bucket are the default when no policy
--    matches. We do NOT add any "public read" policy here. Reads happen via
--    signed URLs issued by the server.

-- 3) (No-op) The public `media` bucket already has a "media public read"
--    policy that covers vendor-uploaded logos/banners stored under
--    `media/vendors/<vendor_id>/...`. The service-role key used by upload
--    server actions bypasses RLS, so no extra insert policy is needed.

-- 4) Mark migration applied.
-- (no-op statement; keeps the migration non-empty if the buckets already exist)
select 1;
