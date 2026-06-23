-- Phase: мульти-метод оплаты. Сохраняем выбранный пользователем способ
-- онлайн-оплаты и причину отмены/ошибки от ЮKassa. Аддитивная и
-- идемпотентная — не ломает 0012_payments.sql.

-- Выбранный способ оплаты: 'card' | 'sbp' | 'sberpay' | 'tpay' |
-- 'alfapay' | 'mirpay' | 'yoomoney'. NULL — для старых записей.
alter table public.payments
  add column if not exists method text;

-- Код и человекочитаемая причина отмены/ошибки
-- (из ЮKassa cancellation_details.reason).
alter table public.payments
  add column if not exists error_code text;
alter table public.payments
  add column if not exists error_message text;
