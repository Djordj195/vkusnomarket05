-- VKUSNOMARKET — Phase 1: Multi-tenant core
-- Adds cities, vendors, vendor outlets, delivery zones.
-- Backfills existing products under the first seed vendor (ВКУСНОМАРКЕТ Кизляр).
-- Run AFTER 0004_feedback.sql in Supabase SQL Editor.

-- ──────────────────────────────────────────────────────────────────────────
-- Cities
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.cities (
  id                text primary key,
  slug              text not null unique,
  name              text not null,
  region            text not null,
  region_type       text not null,
  federal_district  text not null,
  timezone          text not null default 'Europe/Moscow',
  lat               double precision not null,
  lng               double precision not null,
  population        integer,
  -- "active"      — есть продавцы, заказы доступны
  -- "coming_soon" — пока нет продавцов, показываем «Скоро откроемся»
  -- "disabled"    — скрыт из выбора
  status            text not null default 'coming_soon'
                    check (status in ('active','coming_soon','disabled')),
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists cities_status_idx     on public.cities(status);
create index if not exists cities_region_idx     on public.cities(region);
create index if not exists cities_sort_idx       on public.cities(sort_order);

alter table public.cities enable row level security;

-- ──────────────────────────────────────────────────────────────────────────
-- Vendors (продавцы)
-- Каждый продавец — отдельный мини-магазин внутри платформы.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.vendors (
  id                  text primary key,
  slug                text not null unique,
  brand_name          text not null,
  -- food | grocery | pharmacy | chemistry
  vertical_primary    text not null
                      check (vertical_primary in
                        ('food','grocery','pharmacy','chemistry')),
  -- Дополнительные вертикали (для смешанных магазинов)
  verticals           jsonb not null default '[]'::jsonb,
  city_id             text not null references public.cities(id) on delete restrict,
  owner_user_id       text,
  -- draft → pending → approved → suspended → blocked
  status              text not null default 'draft'
                      check (status in
                        ('draft','pending','approved','suspended','blocked')),
  logo_url            text,
  banner_url          text,
  short_description   text,
  description         text,
  -- Юр.информация (заполняется на онбординге)
  legal_entity_type   text check (legal_entity_type in ('IP','OOO','SAMOZ','NONE')),
  legal_name          text,
  inn                 text,
  kpp                 text,
  ogrn                text,
  legal_address       text,
  license_doc_url     text,
  license_number      text,
  license_expires_at  date,
  -- Платёжные реквизиты для выплат
  payout_method       text check (payout_method in
                        ('bank_account','yumoney','sbp','manual')),
  payout_details      jsonb,
  -- Комиссия (если null — берём из tariffs)
  commission_pct      numeric(5,2),
  subscription_tier   text not null default 'free'
                      check (subscription_tier in ('free','basic','premium')),
  -- Контакты для клиентов
  contact_phone       text,
  contact_email       text,
  contact_telegram    text,
  contact_whatsapp    text,
  -- Расписание работы: { "mon": [["09:00","21:00"]], ... }
  working_hours       jsonb,
  holiday_dates       jsonb,
  -- Рейтинг (пересчитывается триггером по reviews)
  rating_avg          numeric(3,2) not null default 0,
  rating_count        integer not null default 0,
  -- Видимость на главной (управляется супер-админом)
  featured            boolean not null default false,
  featured_until      timestamptz,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists vendors_city_idx       on public.vendors(city_id);
create index if not exists vendors_vertical_idx   on public.vendors(vertical_primary);
create index if not exists vendors_status_idx     on public.vendors(status);
create index if not exists vendors_featured_idx   on public.vendors(featured)
  where featured = true;

drop trigger if exists vendors_touch_updated_at on public.vendors;
create trigger vendors_touch_updated_at
  before update on public.vendors
  for each row execute function public.touch_updated_at();

alter table public.vendors enable row level security;

-- ──────────────────────────────────────────────────────────────────────────
-- Vendor outlets (точки продавца — откуда курьер забирает заказ)
-- У продавца может быть несколько точек в одном городе.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.vendor_outlets (
  id              text primary key,
  vendor_id       text not null references public.vendors(id) on delete cascade,
  name            text,
  address         text not null,
  lat             double precision not null,
  lng             double precision not null,
  contact_phone   text,
  opening_hours   jsonb,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists vendor_outlets_vendor_idx on public.vendor_outlets(vendor_id);

alter table public.vendor_outlets enable row level security;

-- ──────────────────────────────────────────────────────────────────────────
-- Delivery zones (зоны доставки продавца)
-- polygon хранится как GeoJSON в jsonb — для совместимости без PostGIS.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.delivery_zones (
  id              text primary key,
  vendor_id       text not null references public.vendors(id) on delete cascade,
  name            text,
  polygon         jsonb not null,
  -- Условия доставки в этой зоне
  min_order       integer not null default 0,
  delivery_fee    integer not null default 0,
  free_from       integer,
  eta_min         integer not null default 30,
  eta_max         integer not null default 60,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists delivery_zones_vendor_idx on public.delivery_zones(vendor_id);

alter table public.delivery_zones enable row level security;

-- ──────────────────────────────────────────────────────────────────────────
-- Add vendor_id and vertical to products
-- (nullable initially → backfill below → can NOT NULL later in Phase 2)
-- ──────────────────────────────────────────────────────────────────────────
alter table public.products
  add column if not exists vendor_id text references public.vendors(id) on delete set null;

alter table public.products
  add column if not exists vertical text
    check (vertical in ('food','grocery','pharmacy','chemistry'));

create index if not exists products_vendor_idx   on public.products(vendor_id);
create index if not exists products_vertical_idx on public.products(vertical);

-- ──────────────────────────────────────────────────────────────────────────
-- Seed: cities (ЮФО + СКФО + крупные города РФ)
-- ──────────────────────────────────────────────────────────────────────────
insert into public.cities
  (id, slug, name, region, region_type, federal_district, timezone, lat, lng, population, status, sort_order)
values
  -- Северо-Кавказский ФО — приоритетный для запуска
  ('city-kizlyar',        'kizlyar',        'Кизляр',          'Республика Дагестан',         'Республика','Северо-Кавказский','Europe/Moscow', 43.8467, 46.7117,    49000, 'active',       1),
  ('city-makhachkala',    'makhachkala',    'Махачкала',       'Республика Дагестан',         'Республика','Северо-Кавказский','Europe/Moscow', 42.9849, 47.5047,   601000, 'coming_soon',  2),
  ('city-derbent',        'derbent',        'Дербент',         'Республика Дагестан',         'Республика','Северо-Кавказский','Europe/Moscow', 42.0577, 48.2980,   126000, 'coming_soon',  3),
  ('city-khasavyurt',     'khasavyurt',     'Хасавюрт',        'Республика Дагестан',         'Республика','Северо-Кавказский','Europe/Moscow', 43.2486, 46.5876,   151000, 'coming_soon',  4),
  ('city-kaspiysk',       'kaspiysk',       'Каспийск',        'Республика Дагестан',         'Республика','Северо-Кавказский','Europe/Moscow', 42.8917, 47.6356,   125000, 'coming_soon',  5),
  ('city-buynaksk',       'buynaksk',       'Буйнакск',        'Республика Дагестан',         'Республика','Северо-Кавказский','Europe/Moscow', 42.8125, 47.1192,    65000, 'coming_soon',  6),
  ('city-izberbash',      'izberbash',      'Избербаш',        'Республика Дагестан',         'Республика','Северо-Кавказский','Europe/Moscow', 42.5667, 47.8667,    61000, 'coming_soon',  7),
  ('city-grozny',         'grozny',         'Грозный',         'Чеченская Республика',        'Республика','Северо-Кавказский','Europe/Moscow', 43.3178, 45.6949,   325000, 'coming_soon',  8),
  ('city-magas',          'magas',          'Магас',           'Республика Ингушетия',        'Республика','Северо-Кавказский','Europe/Moscow', 43.1683, 44.8108,    14000, 'coming_soon',  9),
  ('city-nazran',         'nazran',         'Назрань',         'Республика Ингушетия',        'Республика','Северо-Кавказский','Europe/Moscow', 43.2256, 44.7644,   122000, 'coming_soon', 10),
  ('city-vladikavkaz',    'vladikavkaz',    'Владикавказ',     'Республика Северная Осетия — Алания', 'Республика','Северо-Кавказский','Europe/Moscow', 43.0367, 44.6678, 304000, 'coming_soon', 11),
  ('city-nalchik',        'nalchik',        'Нальчик',         'Кабардино-Балкарская Республика',     'Республика','Северо-Кавказский','Europe/Moscow', 43.4848, 43.6076, 240000, 'coming_soon', 12),
  ('city-cherkessk',      'cherkessk',      'Черкесск',        'Карачаево-Черкесская Республика',     'Республика','Северо-Кавказский','Europe/Moscow', 44.2236, 42.0467, 115000, 'coming_soon', 13),
  ('city-stavropol',      'stavropol',      'Ставрополь',      'Ставропольский край',         'Край','Северо-Кавказский','Europe/Moscow', 45.0428, 41.9734,   452000, 'coming_soon', 14),
  ('city-pyatigorsk',     'pyatigorsk',     'Пятигорск',       'Ставропольский край',         'Край','Северо-Кавказский','Europe/Moscow', 44.0486, 43.0594,   146000, 'coming_soon', 15),
  ('city-minvody',        'mineralnye-vody','Минеральные Воды','Ставропольский край',         'Край','Северо-Кавказский','Europe/Moscow', 44.2106, 43.1356,    77000, 'coming_soon', 16),
  ('city-essentuki',      'essentuki',      'Ессентуки',       'Ставропольский край',         'Край','Северо-Кавказский','Europe/Moscow', 44.0444, 42.8597,   105000, 'coming_soon', 17),
  ('city-kislovodsk',     'kislovodsk',     'Кисловодск',      'Ставропольский край',         'Край','Северо-Кавказский','Europe/Moscow', 43.9050, 42.7239,   127000, 'coming_soon', 18),
  ('city-georgievsk',     'georgievsk',     'Георгиевск',      'Ставропольский край',         'Край','Северо-Кавказский','Europe/Moscow', 44.1494, 43.4708,    66000, 'coming_soon', 19),
  -- Южный ФО
  ('city-rostov',         'rostov-na-donu', 'Ростов-на-Дону',  'Ростовская область',          'Область','Южный','Europe/Moscow', 47.2225, 39.7187,  1138000, 'coming_soon', 20),
  ('city-krasnodar',      'krasnodar',      'Краснодар',       'Краснодарский край',          'Край','Южный','Europe/Moscow', 45.0355, 38.9753,   974000, 'coming_soon', 21),
  ('city-sochi',          'sochi',          'Сочи',            'Краснодарский край',          'Край','Южный','Europe/Moscow', 43.5855, 39.7231,   524000, 'coming_soon', 22),
  ('city-volgograd',      'volgograd',      'Волгоград',       'Волгоградская область',       'Область','Южный','Europe/Moscow', 48.7080, 44.5133,  1004000, 'coming_soon', 23),
  ('city-astrakhan',      'astrakhan',      'Астрахань',       'Астраханская область',        'Область','Южный','Europe/Astrakhan', 46.3497, 48.0408, 524000, 'coming_soon', 24),
  ('city-elista',         'elista',         'Элиста',          'Республика Калмыкия',         'Республика','Южный','Europe/Moscow', 46.3079, 44.2700,   103000, 'coming_soon', 25),
  -- Крупнейшие города РФ
  ('city-moscow',         'moscow',         'Москва',          'Москва',                      'Город федерального значения','Центральный','Europe/Moscow', 55.7558, 37.6173, 12655000, 'coming_soon', 30),
  ('city-spb',            'sankt-peterburg','Санкт-Петербург', 'Санкт-Петербург',             'Город федерального значения','Северо-Западный','Europe/Moscow', 59.9311, 30.3609, 5384000, 'coming_soon', 31),
  ('city-novosibirsk',    'novosibirsk',    'Новосибирск',     'Новосибирская область',       'Область','Сибирский','Asia/Novosibirsk', 55.0084, 82.9357, 1635000, 'coming_soon', 32),
  ('city-ekaterinburg',   'ekaterinburg',   'Екатеринбург',    'Свердловская область',        'Область','Уральский','Asia/Yekaterinburg', 56.8389, 60.6057, 1494000, 'coming_soon', 33),
  ('city-kazan',          'kazan',          'Казань',          'Республика Татарстан',        'Республика','Приволжский','Europe/Moscow', 55.7887, 49.1221, 1308000, 'coming_soon', 34),
  ('city-nizhny',         'nizhny-novgorod','Нижний Новгород', 'Нижегородская область',       'Область','Приволжский','Europe/Moscow', 56.2965, 43.9361, 1228000, 'coming_soon', 35),
  ('city-chelyabinsk',    'chelyabinsk',    'Челябинск',       'Челябинская область',         'Область','Уральский','Asia/Yekaterinburg', 55.1644, 61.4368, 1187000, 'coming_soon', 36),
  ('city-samara',         'samara',         'Самара',          'Самарская область',           'Область','Приволжский','Europe/Samara', 53.1959, 50.1002, 1144000, 'coming_soon', 37),
  ('city-omsk',           'omsk',           'Омск',            'Омская область',              'Область','Сибирский','Asia/Omsk', 54.9885, 73.3242, 1110000, 'coming_soon', 38),
  ('city-ufa',            'ufa',            'Уфа',             'Республика Башкортостан',     'Республика','Приволжский','Asia/Yekaterinburg', 54.7388, 55.9721, 1145000, 'coming_soon', 39),
  ('city-krasnoyarsk',    'krasnoyarsk',    'Красноярск',      'Красноярский край',           'Край','Сибирский','Asia/Krasnoyarsk', 56.0184, 92.8672, 1093000, 'coming_soon', 40),
  ('city-voronezh',       'voronezh',       'Воронеж',         'Воронежская область',         'Область','Центральный','Europe/Moscow', 51.6720, 39.1843, 1058000, 'coming_soon', 41),
  ('city-perm',           'perm',           'Пермь',           'Пермский край',               'Край','Приволжский','Asia/Yekaterinburg', 58.0105, 56.2502, 1049000, 'coming_soon', 42),
  ('city-saratov',        'saratov',        'Саратов',         'Саратовская область',         'Область','Приволжский','Europe/Saratov', 51.5331, 46.0344,  830000, 'coming_soon', 43),
  ('city-tyumen',         'tyumen',         'Тюмень',          'Тюменская область',           'Область','Уральский','Asia/Yekaterinburg', 57.1530, 65.5343,  847000, 'coming_soon', 44),
  ('city-tolyatti',       'tolyatti',       'Тольятти',        'Самарская область',           'Область','Приволжский','Europe/Samara', 53.5303, 49.3461,  684000, 'coming_soon', 45),
  ('city-izhevsk',        'izhevsk',        'Ижевск',          'Удмуртская Республика',       'Республика','Приволжский','Europe/Moscow', 56.8526, 53.2114,  651000, 'coming_soon', 46),
  ('city-barnaul',        'barnaul',        'Барнаул',         'Алтайский край',              'Край','Сибирский','Asia/Barnaul', 53.3478, 83.7800,  624000, 'coming_soon', 47),
  ('city-ulyanovsk',      'ulyanovsk',      'Ульяновск',       'Ульяновская область',         'Область','Приволжский','Europe/Ulyanovsk', 54.3142, 48.4031, 627000, 'coming_soon', 48),
  ('city-irkutsk',        'irkutsk',        'Иркутск',         'Иркутская область',           'Область','Сибирский','Asia/Irkutsk', 52.2864, 104.2806,  617000, 'coming_soon', 49),
  ('city-khabarovsk',     'khabarovsk',     'Хабаровск',       'Хабаровский край',            'Край','Дальневосточный','Asia/Vladivostok', 48.4827, 135.0838, 610000, 'coming_soon', 50),
  ('city-vladivostok',    'vladivostok',    'Владивосток',     'Приморский край',             'Край','Дальневосточный','Asia/Vladivostok', 43.1198, 131.8869, 600000, 'coming_soon', 51),
  ('city-yaroslavl',      'yaroslavl',      'Ярославль',       'Ярославская область',         'Область','Центральный','Europe/Moscow', 57.6261, 39.8845,  605000, 'coming_soon', 52),
  ('city-tula',           'tula',           'Тула',            'Тульская область',            'Область','Центральный','Europe/Moscow', 54.1961, 37.6182,  461000, 'coming_soon', 53),
  ('city-kaliningrad',    'kaliningrad',    'Калининград',     'Калининградская область',     'Область','Северо-Западный','Europe/Kaliningrad', 54.7104, 20.4522, 498000, 'coming_soon', 54)
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────────────────────
-- Seed: первый продавец «ВКУСНОМАРКЕТ Кизляр»
-- Все существующие 44 товара привязываются к этому продавцу.
-- ──────────────────────────────────────────────────────────────────────────
insert into public.vendors (
  id, slug, brand_name,
  vertical_primary, verticals,
  city_id, status,
  short_description, description,
  contact_phone, contact_telegram, contact_whatsapp,
  rating_avg, rating_count,
  featured, sort_order
) values (
  'vnd-vkusnomarket-kizlyar',
  'vkusnomarket-kizlyar',
  'ВКУСНОМАРКЕТ Кизляр',
  'food',
  '["food","grocery"]'::jsonb,
  'city-kizlyar',
  'approved',
  'Готовая еда, продукты с рынка и из лавок Кизляра',
  'Первый продавец платформы ВКУСНОМАРКЕТ — собственный магазин с готовой едой, свежими овощами и фруктами с местного рынка, мясом, выпечкой и товарами с лавок.',
  '+79375021100',
  '@vkusnomarket05_bot',
  '+79375021100',
  4.9, 50,
  true, 1
)
on conflict (id) do nothing;

-- Точка самовывоза в Кизляре
insert into public.vendor_outlets (id, vendor_id, name, address, lat, lng, contact_phone, is_primary)
values
  ('outlet-vkusnomarket-kizlyar-main',
   'vnd-vkusnomarket-kizlyar',
   'Главная точка',
   'г. Кизляр, ул. Советская, 1',
   43.8467, 46.7117,
   '+79375021100',
   true)
on conflict (id) do nothing;

-- Backfill: все товары привязываем к первому продавцу
-- + проставляем vertical на основе старого поля source
update public.products
   set vendor_id = 'vnd-vkusnomarket-kizlyar'
 where vendor_id is null;

update public.products
   set vertical = case
     when source = 'food'             then 'food'
     when source in ('market','shop') then 'grocery'
     else 'grocery'
   end
 where vertical is null;
