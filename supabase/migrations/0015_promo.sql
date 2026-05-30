-- Phase 11: промокоды + журнал применений + поля скидок на заказах.
-- Идемпотентна. Безопасна для повторного применения.

create table if not exists public.promo_codes (
  id                  text primary key,
  code                text not null unique,
  description         text not null default '',
  kind                text not null check (kind in ('percent','fixed','free_shipping')),
  -- Для percent: 1..100. Для fixed: сумма в рублях (целое). Для free_shipping игнорируется.
  value               integer not null default 0,
  -- Минимальная сумма подытога (без доставки), в рублях. 0 = без минимума.
  min_subtotal        integer not null default 0,
  -- Максимальная сумма скидки (рубли) — применяется ко всем kind'ам кроме free_shipping. 0 = без потолка.
  max_discount        integer not null default 0,
  -- Период действия. Если null — без ограничения.
  valid_from          timestamptz,
  valid_until         timestamptz,
  -- Общий лимит использований. 0 = без лимита.
  usage_limit         integer not null default 0,
  -- Лимит на одного клиента (телефон). 0 = без лимита.
  per_user_limit      integer not null default 1,
  -- Привязки. NULL = действует везде.
  vendor_id           text references public.vendors(id) on delete set null,
  category_id         text references public.categories(id) on delete set null,
  -- Активен ли промокод.
  active              boolean not null default true,
  -- Счётчики (денормализованы для скорости).
  used_count          integer not null default 0,
  total_discount      integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists promo_codes_code_idx     on public.promo_codes(code);
create index if not exists promo_codes_active_idx   on public.promo_codes(active);
create index if not exists promo_codes_vendor_idx   on public.promo_codes(vendor_id);
create index if not exists promo_codes_category_idx on public.promo_codes(category_id);

alter table public.promo_codes enable row level security;

create table if not exists public.promo_redemptions (
  id              text primary key,
  promo_code_id   text not null references public.promo_codes(id) on delete cascade,
  promo_code      text not null,
  order_id        text references public.orders(id) on delete set null,
  customer_phone  text not null,
  customer_name   text,
  vendor_id       text references public.vendors(id) on delete set null,
  -- Сумма скидки в рублях (положительное число).
  discount_amount integer not null default 0,
  -- Подытог группы, на который применена скидка.
  subtotal        integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists promo_redemptions_code_idx   on public.promo_redemptions(promo_code_id);
create index if not exists promo_redemptions_phone_idx  on public.promo_redemptions(customer_phone);
create index if not exists promo_redemptions_order_idx  on public.promo_redemptions(order_id);
create index if not exists promo_redemptions_date_idx   on public.promo_redemptions(created_at desc);

alter table public.promo_redemptions enable row level security;

-- Поля скидок на orders. Если уже есть — не трогаем.
alter table public.orders
  add column if not exists discount_total integer not null default 0;
alter table public.orders
  add column if not exists promo_code_id  text references public.promo_codes(id) on delete set null;
alter table public.orders
  add column if not exists promo_code     text;

create index if not exists orders_promo_idx on public.orders(promo_code_id);
