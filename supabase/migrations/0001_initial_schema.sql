-- VKUSNOMARKET — initial schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/<id>/sql

-- ──────────────────────────────────────────────────────────────────────────
-- Couriers
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.couriers (
  id          text primary key,
  name        text not null,
  phone       text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────
-- Orders
-- items column stores the snapshotted order items (name/price at order time)
-- so price changes later don't rewrite history.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id              text primary key,
  number          text not null unique,
  created_at      timestamptz not null default now(),
  customer_name   text not null,
  customer_phone  text not null,
  address         text not null,
  comment         text,
  geo_lat         double precision,
  geo_lng         double precision,
  payment         text not null check (payment in ('cash', 'card')),
  items           jsonb not null,
  subtotal        integer not null,
  delivery_fee    integer not null,
  total           integer not null,
  status          text not null check (status in (
                    'accepted','preparing','courier','delivered','cancelled'
                  )) default 'accepted',
  courier_id      text references public.couriers(id) on delete set null
);

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- The app accesses Supabase only via the service_role key (server-side only),
-- so RLS is enabled with no policies — anon/authenticated users get nothing
-- by default. This keeps the data safe even if the anon key is exposed.
-- ──────────────────────────────────────────────────────────────────────────
alter table public.couriers enable row level security;
alter table public.orders   enable row level security;

-- ──────────────────────────────────────────────────────────────────────────
-- Seed: starter couriers (можно удалить и завести своих через админку)
-- ──────────────────────────────────────────────────────────────────────────
insert into public.couriers (id, name, phone, is_active) values
  ('c-1', 'Курьер №1', '+7 (999) 000-00-01', true),
  ('c-2', 'Курьер №2', '+7 (999) 000-00-02', true)
on conflict (id) do nothing;
