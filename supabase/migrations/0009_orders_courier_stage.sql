-- Phase 5: courier app — sub-status for orders that are with the courier.
--
-- The platform-level Order.status flow stays the same:
--   accepted → preparing → courier → delivered (or cancelled)
--
-- Inside the `courier` macro-status the courier reports a finer-grained
-- stage so the customer can see "courier is on the way / arrived /
-- picked up / in transit / arrived at you / delivered" without us having
-- to overload the existing OrderStatus enum.
--
-- All values are advisory — nothing else in the system depends on them
-- being non-null. Old rows from before this migration remain NULL and
-- render in the UI as "Передан курьеру".
--
-- Run after 0008_orders_multivendor.sql. Idempotent.

alter table public.orders
  add column if not exists courier_stage text
    check (courier_stage in (
      'dispatching',     -- направляюсь в магазин
      'arrived_pickup',  -- прибыл в магазин
      'picked_up',       -- забрал заказ
      'in_transit',      -- в пути к клиенту
      'arrived_dropoff', -- прибыл к клиенту
      'completed',       -- доставлено
      'failed'           -- не удалось доставить
    ));

create index if not exists orders_courier_stage_idx on public.orders(courier_stage);
