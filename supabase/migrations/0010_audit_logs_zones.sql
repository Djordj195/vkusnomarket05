-- Phase 6: audit_logs + удобства для редактора зон доставки.
--
-- audit_logs хранит «каждое управляющее действие» (модерация продавца,
-- смена статуса заказа, переключение города, правка зоны и т.п.).
-- Колонка `payload` — произвольный JSON с before/after или входными
-- параметрами действия. RLS включён; политики добавим в Phase 6.5
-- вместе с реальной RBAC-привязкой пользователей к ролям.
--
-- Запускать после 0009. Идемпотентная.

create table if not exists public.audit_logs (
  id           text primary key,
  actor_type   text not null check (actor_type in ('admin','vendor','courier','system','client')),
  actor_id     text,
  actor_label  text,
  action       text not null,
  target_type  text,
  target_id    text,
  payload      jsonb,
  ip           text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_idx     on public.audit_logs(actor_type, actor_id);
create index if not exists audit_logs_target_idx    on public.audit_logs(target_type, target_id);
create index if not exists audit_logs_action_idx    on public.audit_logs(action);

alter table public.audit_logs enable row level security;

-- Helper-колонка для зон: текстовое имя видно сразу в админ-списке.
-- Это безопасно: name уже определён, просто гарантируем, что у каждой
-- зоны есть человеко-читаемый ярлык. Идемпотентно.
update public.delivery_zones
   set name = coalesce(nullif(trim(name), ''), 'Зона доставки')
 where name is null or trim(name) = '';
