-- Phase 4: multi-vendor cart + checkout.
--
-- Adds vendor_id to orders so checkout can produce one order per vendor
-- (split orders). vendor_id is nullable for backfill compatibility — every
-- new order from Phase 4 onward will have it populated. Existing rows from
-- Phase 1-3 stay NULL and continue to render in admin / client lists.
--
-- Also adds delivery_kind (delivery vs pickup) and desired_at (scheduled
-- delivery window) so checkout can capture both. Defaults preserve current
-- behaviour for any code path that doesn't set them.
--
-- Run after 0007_vendor_courier_media.sql. Idempotent.

alter table public.orders
  add column if not exists vendor_id text references public.vendors(id) on delete set null;

create index if not exists orders_vendor_id_idx on public.orders(vendor_id);

alter table public.orders
  add column if not exists delivery_kind text
    check (delivery_kind in ('delivery', 'pickup'))
    default 'delivery';

alter table public.orders
  add column if not exists desired_at timestamptz;

-- For multi-vendor split orders we record a group id so admin / client UIs
-- can show "this was one checkout that produced N orders". Nullable for old
-- rows that pre-date the split.
alter table public.orders
  add column if not exists checkout_group_id text;

create index if not exists orders_checkout_group_idx on public.orders(checkout_group_id);
