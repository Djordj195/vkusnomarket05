-- Phase 10: модуль поддержки (тикеты + сообщения).
-- Идемпотентна. Безопасна для повторного применения.

create table if not exists public.tickets (
  id                    text primary key,
  number                text not null unique,
  requester_type        text not null check (requester_type in ('client','vendor','courier','guest')),
  requester_id          text,
  requester_name        text not null,
  requester_contact     text not null,
  category              text not null check (category in (
                          'order','payment','delivery','product','account',
                          'vendor','courier','complaint','suggestion','other'
                        )),
  subject               text not null,
  status                text not null default 'open' check (status in (
                          'open','in_progress','waiting_user','resolved','closed'
                        )),
  priority              text not null default 'normal' check (priority in (
                          'low','normal','high','urgent'
                        )),
  order_id              text references public.orders(id) on delete set null,
  assignee_id           text,
  assignee_name         text,
  last_message_at       timestamptz not null default now(),
  last_message_preview  text not null default '',
  unread_for_user       integer not null default 0,
  unread_for_support    integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  resolved_at           timestamptz,
  closed_at             timestamptz
);

create index if not exists tickets_status_idx       on public.tickets(status);
create index if not exists tickets_priority_idx     on public.tickets(priority);
create index if not exists tickets_requester_idx    on public.tickets(requester_type, requester_id);
create index if not exists tickets_assignee_idx     on public.tickets(assignee_id);
create index if not exists tickets_order_idx        on public.tickets(order_id);
create index if not exists tickets_created_at_idx   on public.tickets(created_at desc);
create index if not exists tickets_last_message_idx on public.tickets(last_message_at desc);

alter table public.tickets enable row level security;

create table if not exists public.ticket_messages (
  id           text primary key,
  ticket_id    text not null references public.tickets(id) on delete cascade,
  author_type  text not null check (author_type in ('requester','support','system')),
  author_id    text,
  author_name  text,
  body         text not null,
  attachments  jsonb not null default '[]'::jsonb,
  is_internal  boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists ticket_messages_ticket_idx
  on public.ticket_messages(ticket_id, created_at asc);

alter table public.ticket_messages enable row level security;
-- Номера тикетов вида T-0001 генерируются на стороне приложения как count(tickets)+1.
-- Уникальный constraint на tickets.number прикроет редкие гонки.
