-- Phase 12: Сплитование платежей ЮKassa.
-- Каждый продавец получает свой yookassa_shop_id (присваивается после
-- регистрации продавца на платформе ЮKassa). commission_rate определяет
-- долю платформы (по умолчанию 5%).

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS yookassa_shop_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 5.00;

COMMENT ON COLUMN vendors.yookassa_shop_id IS 'Shop ID продавца в ЮKassa (для split-платежей)';
COMMENT ON COLUMN vendors.commission_rate IS 'Процент комиссии платформы (по умолчанию 5%)';
