-- Tariffs: комиссии маркетплейса с CRUD.
create table if not exists tariffs (
  id          text primary key,
  name        text not null,
  fee_percent numeric(5,2) not null default 12,
  description text not null default '',
  min_revenue bigint,
  is_default  boolean not null default false,
  sort_order  int not null default 0
);

-- Начальные данные
insert into tariffs (id, name, fee_percent, description, min_revenue, is_default, sort_order)
values
  ('tariff-basic',   'Базовый',  12, 'Стандартная комиссия маркетплейса', null,    true,  0),
  ('tariff-premium', 'Премиум',   8, 'Для крупных продавцов с оборотом > 1 млн ₽/мес', 1000000, false, 1),
  ('tariff-partner', 'Партнёр',   5, 'Индивидуальные условия для якорных партнёров', null, false, 2)
on conflict (id) do nothing;
