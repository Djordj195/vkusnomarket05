-- Phase 12: Reviews & ratings
-- Customers can leave star-rated reviews for products and shops.
-- Reviews go through moderation (pending → approved / rejected).

create table if not exists reviews (
  id          text primary key,
  created_at  timestamptz not null default now(),

  -- Who left the review
  user_phone  text not null,
  user_name   text not null default '',

  -- What is being reviewed: 'product' or 'shop'
  target_type text not null check (target_type in ('product', 'shop')),
  target_id   text not null,

  -- Optional link to a delivered order (proves purchase)
  order_id    text,

  -- 1–5 star rating
  rating      smallint not null check (rating >= 1 and rating <= 5),

  -- Free-text comment (may be empty)
  comment     text not null default '',

  -- Moderation status
  status      text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewer    text
);

-- Fast lookups by target
create index if not exists idx_reviews_target
  on reviews (target_type, target_id, status);

-- Fast lookups for admin moderation queue
create index if not exists idx_reviews_status
  on reviews (status, created_at desc);

-- Prevent duplicate reviews from the same user for the same target
create unique index if not exists idx_reviews_unique_user_target
  on reviews (user_phone, target_type, target_id);
