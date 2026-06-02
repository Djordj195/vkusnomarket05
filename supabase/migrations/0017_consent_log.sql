-- Phase 7 addendum: consent log.
-- Фиксация согласий пользователей с юридическими документами.
-- Каждая запись хранит: кто согласился, с каким документом и версией,
-- IP-адрес, user-agent (устройство), timestamp.

create table if not exists consent_log (
  id          text primary key,
  created_at  timestamptz not null default now(),

  -- Кто дал согласие (телефон пользователя)
  user_phone  text not null,

  -- Контекст: откуда получено согласие
  context     text not null check (context in (
    'client_login', 'vendor_login', 'courier_login', 'checkout', 'signup'
  )),

  -- Список документов, с которыми согласился (slug'и через запятую)
  doc_slugs   text not null,

  -- Версии документов на момент согласия (JSON: {"offer": "v1", ...})
  doc_versions text not null default '{}',

  -- Текст чекбокса, который видел пользователь
  checkbox_text text not null default '',

  -- Сетевые данные
  ip          text,
  user_agent  text,
  device_info text
);

-- Быстрый поиск по телефону
create index if not exists idx_consent_log_phone
  on consent_log (user_phone, created_at desc);

-- Быстрый поиск по документу
create index if not exists idx_consent_log_doc
  on consent_log (doc_slugs, created_at desc);
