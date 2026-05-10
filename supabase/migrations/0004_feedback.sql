-- VKUSNOMARKET — feedback / customer reviews
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/<id>/sql

-- ──────────────────────────────────────────────────────────────────────────
-- Customer feedback / reviews left from /feedback
-- New rows are created with status='pending' and need admin moderation
-- before they appear publicly on the home page / /reviews.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.feedback (
  id          text primary key,
  created_at  timestamptz not null default now(),
  name        text not null default '',
  contact     text not null default '',
  message     text not null,
  status      text not null check (status in ('pending', 'approved', 'rejected'))
              default 'pending',
  reviewed_at timestamptz,
  reviewer    text
);

create index if not exists feedback_status_idx
  on public.feedback (status);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- RLS: same pattern as the rest of the schema. The app accesses Supabase
-- only via the service_role key (server-side), so RLS is enabled with no
-- policies — anon/authenticated users get nothing by default.
-- ──────────────────────────────────────────────────────────────────────────
alter table public.feedback enable row level security;
