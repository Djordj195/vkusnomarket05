-- Промо-баннеры главной страницы.
create table if not exists banners (
  id         text primary key,
  title      text not null,
  subtitle   text not null default '',
  image_url  text not null default '',
  link_url   text not null default '',
  city_id    text,
  bg_color   text not null default '#7c3aed',
  text_color text not null default '#ffffff',
  is_active  boolean not null default true,
  sort_order int not null default 0,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);
