-- Phase 9: уведомления (Web Push + email + SMS).
-- Идемпотентная.

-- ──────────────────────────────────────────────────────────────────────
-- 1. Подписки на Web Push.
-- Один пользователь может иметь несколько активных подписок
-- (десктоп + мобильник + другой браузер).
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id                  text primary key,
  -- Кому принадлежит подписка: client / vendor / courier / admin.
  recipient_type      text not null
    check (recipient_type in ('client','vendor','courier','admin')),
  -- ID пользователя в соответствующей таблице (или нормализованный
  -- телефон для client, если у нас нет полной таблицы users).
  recipient_id        text not null,
  -- Web Push endpoint URL (FCM / Mozilla / Apple).
  endpoint            text not null,
  -- p256dh public key и auth secret из PushSubscription.getKey().
  p256dh              text not null,
  auth                text not null,
  -- Метаданные.
  user_agent          text,
  enabled             boolean not null default true,
  created_at          timestamptz not null default now(),
  last_seen_at        timestamptz not null default now(),
  unique (endpoint)
);
create index if not exists push_subs_recipient_idx
  on public.push_subscriptions(recipient_type, recipient_id);
create index if not exists push_subs_enabled_idx
  on public.push_subscriptions(enabled);
alter table public.push_subscriptions enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 2. Настройки уведомлений (опт-ин по каналам / событиям).
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.notification_preferences (
  id                  text primary key,
  recipient_type      text not null
    check (recipient_type in ('client','vendor','courier','admin')),
  recipient_id        text not null,
  -- Канал: push / email / sms.
  channel             text not null check (channel in ('push','email','sms')),
  -- Событие: order.new, order.status, order.assigned_courier, payment.succeeded, …
  event               text not null,
  enabled             boolean not null default true,
  updated_at          timestamptz not null default now(),
  unique (recipient_type, recipient_id, channel, event)
);
create index if not exists notif_prefs_recipient_idx
  on public.notification_preferences(recipient_type, recipient_id);
alter table public.notification_preferences enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 3. Журнал отправок (для /admin/notifications и аудита).
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.notification_log (
  id                  text primary key,
  recipient_type      text not null,
  recipient_id        text not null,
  channel             text not null check (channel in ('push','email','sms')),
  event               text not null,
  -- 'queued','sent','failed','skipped'
  status              text not null,
  -- Тема/заголовок и тело (для аудита и ре-отправки).
  title               text,
  body                text,
  -- Доп. данные: order_id, payment_id, deep_link, и т.п.
  payload             jsonb,
  error               text,
  created_at          timestamptz not null default now()
);
create index if not exists notif_log_created_idx
  on public.notification_log(created_at desc);
create index if not exists notif_log_recipient_idx
  on public.notification_log(recipient_type, recipient_id);
create index if not exists notif_log_channel_idx
  on public.notification_log(channel);
create index if not exists notif_log_status_idx
  on public.notification_log(status);
alter table public.notification_log enable row level security;
