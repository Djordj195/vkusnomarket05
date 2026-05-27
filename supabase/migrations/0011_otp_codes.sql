-- Phase 7: passwordless SMS auth. Хранит активные OTP-коды и rate-limit
-- следящий за частотой попыток. Идемпотентная.

create table if not exists public.otp_codes (
  id           text primary key,
  -- Нормализованный российский номер: 11 цифр, начиная с 7.
  phone        text not null,
  -- Целевая аудитория, чтобы коды для разных кабинетов не пересекались.
  purpose      text not null check (purpose in ('client_login','vendor_login','courier_login')),
  -- 6-значный код в открытом виде. Хранится не дольше TTL (см. expires_at).
  code         text not null,
  -- Сколько раз клиент пытался ввести этот код. После 5 попыток код инвалидируется.
  attempts     integer not null default 0,
  consumed_at  timestamptz,
  -- Кем код был запрошен (опц. — пишем session id когда есть).
  requested_by text,
  ip           text,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null
);

create index if not exists otp_codes_phone_purpose_idx
  on public.otp_codes(phone, purpose, created_at desc);
create index if not exists otp_codes_expires_at_idx
  on public.otp_codes(expires_at);

alter table public.otp_codes enable row level security;
