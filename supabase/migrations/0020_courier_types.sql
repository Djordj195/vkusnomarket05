-- Два типа курьеров: платформы и магазина.
-- Безопасно: добавляет колонки только если их ещё нет.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'couriers' and column_name = 'courier_type'
  ) then
    alter table couriers add column courier_type text not null default 'platform'
      check (courier_type in ('platform', 'shop'));
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'couriers' and column_name = 'shop_id'
  ) then
    alter table couriers add column shop_id text;
  end if;
end $$;
