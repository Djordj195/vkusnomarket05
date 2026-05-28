-- Phase 8: ЮKassa payments + 54-FZ receipts.
-- Платёж привязан к checkout_group (Phase 4) — один платёж покрывает
-- все split-orders на разных продавцов. Идемпотентная.

create table if not exists public.payments (
  id                    text primary key,
  -- Group из orders.checkout_group_id. Один платёж → 1..N заказов.
  checkout_group_id     text not null,
  -- Сумма в копейках (intеger), чтобы не было плавающей точки.
  amount_kop            integer not null,
  currency              text not null default 'RUB',
  -- Канал оплаты: 'yookassa' | 'cash' | 'manual'.
  provider              text not null,
  -- ID платежа на стороне провайдера (UUID от ЮKassa).
  provider_payment_id   text,
  -- 'pending' (создан, ждём webhook), 'waiting_for_capture',
  -- 'succeeded', 'canceled', 'refunded' (полностью), 'partially_refunded'.
  status                text not null default 'pending',
  -- Idempotency-Key передаваемый в ЮKassa create-payment.
  idempotency_key       text,
  -- URL для редиректа клиента на оплату.
  confirmation_url      text,
  -- Информация о покупателе (для 54-ФЗ чека и связи с заказом).
  customer_phone        text,
  customer_email        text,
  -- 54-ФЗ чек: товарные позиции, налоги (хранится для аудита/возврата).
  receipt               jsonb,
  -- Полный ответ ЮKassa на момент последнего обновления.
  raw                   jsonb,
  -- Сумма уже возвращённого (для частичного refund).
  refunded_kop          integer not null default 0,
  -- Возвраты: массив { id, amount_kop, reason, created_at, raw }.
  refunds               jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists payments_group_idx
  on public.payments(checkout_group_id);
create index if not exists payments_provider_pid_idx
  on public.payments(provider_payment_id);
create index if not exists payments_status_idx
  on public.payments(status);
create index if not exists payments_created_at_idx
  on public.payments(created_at desc);

alter table public.payments enable row level security;

-- На orders добавляем ссылку на платёж (опц.).
alter table public.orders
  add column if not exists payment_id text;
create index if not exists orders_payment_id_idx
  on public.orders(payment_id);

-- На orders добавляем зеркальное поле статуса оплаты, чтобы UI продавца/
-- админа быстро видел «оплачено / не оплачено / в обработке».
alter table public.orders
  add column if not exists payment_status text
    check (payment_status in (
      'pending','waiting_for_capture','succeeded','canceled',
      'refunded','partially_refunded'
    ));
