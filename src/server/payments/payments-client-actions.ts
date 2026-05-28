"use server";

import type { Order, Payment } from "@/lib/types";
import { listOrdersByCheckoutGroup } from "../orders-store";
import { listPayments } from "./payments-store";
import { refreshPaymentStatus } from "./payments-actions";

/**
 * Клиентский экшен: вернуть актуальный статус платежа и связанные заказы
 * по checkoutGroupId. Используется на /orders после возврата с ЮKassa.
 *
 * Идемпотентен: ничего не меняет в БД, только опционально опрашивает
 * провайдера (через refreshPaymentStatus → yooGetPayment).
 */
export async function refreshPaymentForGroupAction(
  groupId: string
): Promise<{
  ok: boolean;
  payment?: Payment;
  orders?: Order[];
  error?: string;
}> {
  const payments = await listPayments({ limit: 100 });
  const payment = payments.find((p) => p.checkoutGroupId === groupId);
  if (!payment) {
    // Заказ ещё может быть в локальном in-memory сторе — отдадим только orders.
    const orders = await listOrdersByCheckoutGroup(groupId);
    return { ok: true, orders };
  }

  const refreshed = await refreshPaymentStatus(payment.id);
  const orders = await listOrdersByCheckoutGroup(groupId);
  return {
    ok: true,
    payment: refreshed.payment ?? payment,
    orders,
  };
}
