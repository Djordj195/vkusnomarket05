import "server-only";
import type { Order, PaymentReceipt, PaymentReceiptItem } from "@/lib/types";

// 54-ФЗ: на каждую оплату должен формироваться кассовый чек.
// ЮKassa передаёт чек в ОФД, если в платёж положить `receipt` со списком
// позиций. Мы собираем этот объект из всех split-orders одной checkout-группы.
//
// Налог по умолчанию: vat_code = 1 («без НДС») — подойдёт для ИП на УСН.
// Если у ИП ОСНО — нужно переключить на 4 (НДС 20%) или 3 (НДС 10%).
// Регулируется ENV-переменной PAYMENT_DEFAULT_VAT_CODE.

type VatCode = PaymentReceiptItem["vatCode"];

function readDefaultVat(): VatCode {
  const n = Number(process.env.PAYMENT_DEFAULT_VAT_CODE ?? "1");
  if (n >= 1 && n <= 6) return n as VatCode;
  return 1;
}

function rubToKop(rub: number): number {
  return Math.round(rub * 100);
}

/**
 * Собрать 54-ФЗ чек из массива split-orders одной checkout-группы.
 * - items: товары всех заказов + строки доставки (если есть)
 * - customer: контакт клиента (телефон обязателен, email — если есть)
 */
export function buildReceiptFromOrders(
  orders: Order[],
  contact: { phone?: string; email?: string }
): PaymentReceipt {
  const vatCode = readDefaultVat();
  const items: PaymentReceiptItem[] = [];

  for (const order of orders) {
    for (const it of order.items) {
      items.push({
        description: it.name.slice(0, 128),
        quantity: it.quantity,
        amountKop: rubToKop(it.price),
        vatCode,
        paymentMode: "full_payment",
        paymentSubject: "commodity",
      });
    }
    if (order.deliveryFee > 0) {
      items.push({
        description: "Доставка",
        quantity: 1,
        amountKop: rubToKop(order.deliveryFee),
        vatCode,
        paymentMode: "full_payment",
        paymentSubject: "service",
      });
    }
  }

  return {
    customer: {
      phone: contact.phone,
      email: contact.email,
    },
    items,
  };
}

export function totalKopFromOrders(orders: Order[]): number {
  return orders.reduce((s, o) => s + rubToKop(o.total), 0);
}
