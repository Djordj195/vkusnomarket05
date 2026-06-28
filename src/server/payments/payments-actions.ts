"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "../admin-auth";
import { logAudit } from "../audit-store";
import { listOrdersByCheckoutGroup, saveOrder } from "../orders-store";
import {
  appendRefund,
  getPaymentById,
  getPaymentByProviderId,
  listPayments,
  savePayment,
  updatePaymentStatus,
} from "./payments-store";
import { buildReceiptFromOrders, totalKopFromOrders } from "./receipt";
import {
  isYookassaConfigured,
  yooCreatePayment,
  yooCreateRefund,
  yooGetPayment,
  yooMethodType,
} from "./yookassa";
import type { YooTransfer } from "./yookassa";
import type {
  OnlinePaymentMethod,
  Order,
  Payment,
  PaymentProvider,
  PaymentStatus,
} from "@/lib/types";
import {
  notifyPaymentRefunded,
  notifyPaymentSucceeded,
} from "../notifications/events";
import { getVendorById } from "../vendors-store";

// Причина отмены платежа из ЮKassa cancellation_details → человекочитаемо.
function cancellationFrom(data: {
  cancellation_details?: { party?: string; reason?: string };
}): { errorCode: string | null; errorMessage: string | null } {
  const reason = data.cancellation_details?.reason ?? null;
  return { errorCode: reason, errorMessage: reason };
}

// Извлекает причину отмены из произвольного raw: это может быть объект
// платежа ЮKassa (cancellation_details на верхнем уровне) или webhook-
// payload (cancellation_details внутри .object).
function cancellationFromRaw(
  raw: unknown
): { errorCode: string | null; errorMessage: string | null } {
  if (!raw || typeof raw !== "object") {
    return { errorCode: null, errorMessage: null };
  }
  const top = raw as {
    cancellation_details?: { reason?: string };
    object?: { cancellation_details?: { reason?: string } };
  };
  const reason =
    top.cancellation_details?.reason ??
    top.object?.cancellation_details?.reason ??
    null;
  return { errorCode: reason, errorMessage: reason };
}

function newPaymentId(): string {
  return `pmt-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function newIdempotencyKey(): string {
  return `idk-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function publicSiteUrl(): string {
  return (
    process.env.YOOKASSA_RETURN_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://vkusnomarket05.vercel.app"
  );
}

/**
 * Строит массив transfers для сплитования ЮKassa.
 * Группирует заказы по vendorId, вычисляет комиссию платформы для каждого.
 * Если ни у одного продавца нет yookassaShopId — transfers пустой (обычный
 * платёж, средства идут на счёт платформы целиком).
 */
async function buildTransfers(
  orders: Order[],
  _totalKop: number
): Promise<{ transfers: YooTransfer[]; onBehalfOf?: string }> {
  const vendorTotalsKop = new Map<string, number>();
  for (const order of orders) {
    if (!order.vendorId) continue;
    const current = vendorTotalsKop.get(order.vendorId) ?? 0;
    vendorTotalsKop.set(order.vendorId, current + Math.round(order.total * 100));
  }

  const transfers: YooTransfer[] = [];
  let onBehalfOf: string | undefined;

  for (const [vendorId, vendorKop] of vendorTotalsKop) {
    const vendor = await getVendorById(vendorId);
    if (!vendor?.yookassaShopId) continue;

    const rate = vendor.commissionRate / 100;
    const platformFeeKop = Math.round(vendorKop * rate);
    const vendorAmountKop = vendorKop - platformFeeKop;

    transfers.push({
      accountId: vendor.yookassaShopId,
      amountKop: vendorAmountKop,
      platformFeeKop,
    });

    if (!onBehalfOf) onBehalfOf = vendor.yookassaShopId;
  }

  return { transfers, onBehalfOf };
}

/**
 * Создать платёж для checkout-группы (Phase 4): один платёж покрывает
 * все split-orders одной группы. Возвращает confirmation_url (или
 * демо-URL — для preview без креден ЮKassa).
 *
 * Идемпотентность: если для группы уже есть платёж в статусе pending или
 * waiting_for_capture — возвращаем его confirmation_url, не создаём новый.
 */
export async function createPaymentForCheckoutGroup(input: {
  checkoutGroupId: string;
  customerPhone?: string;
  customerEmail?: string;
  method?: OnlinePaymentMethod;
}): Promise<
  | { ok: true; payment: Payment; demo: boolean }
  | { ok: false; error: string }
> {
  const orders = await listOrdersByCheckoutGroup(input.checkoutGroupId);
  if (orders.length === 0) {
    return { ok: false, error: "Заказы не найдены." };
  }

  // Если для группы уже есть active платёж — отдаём его.
  const existing = (await listPayments({ limit: 200 })).find(
    (p) =>
      p.checkoutGroupId === input.checkoutGroupId &&
      (p.status === "pending" ||
        p.status === "waiting_for_capture" ||
        p.status === "succeeded")
  );
  if (existing) {
    return { ok: true, payment: existing, demo: existing.provider !== "yookassa" };
  }

  const amountKop = totalKopFromOrders(orders);
  if (amountKop <= 0) return { ok: false, error: "Сумма заказа = 0." };

  const phone =
    input.customerPhone ??
    orders.find((o) => o.customerPhone)?.customerPhone ??
    undefined;
  const receipt = buildReceiptFromOrders(orders, {
    phone,
    email: input.customerEmail,
  });

  const paymentId = newPaymentId();
  const idempotencyKey = newIdempotencyKey();
  const now = new Date().toISOString();

  const description = `ВКУСМАРКЕТ заказ ${orders
    .map((o) => o.number)
    .join(", ")}`;
  const returnUrl = `${publicSiteUrl()}/market/orders?group=${encodeURIComponent(
    input.checkoutGroupId
  )}&pay=return`;

  if (isYookassaConfigured()) {
    const splitData = await buildTransfers(orders, amountKop);
    const res = await yooCreatePayment({
      amountKop,
      description,
      idempotencyKey,
      returnUrl,
      receipt,
      metadata: {
        checkout_group_id: input.checkoutGroupId,
        payment_id: paymentId,
        ...(input.method ? { method: input.method } : {}),
      },
      paymentMethodType: yooMethodType(input.method),
      transfers: splitData.transfers,
      onBehalfOf: splitData.onBehalfOf,
    });
    if (!res.ok) {
      await logAudit({
        actorType: "system",
        action: "payment.create_failed",
        targetType: "checkout_group",
        targetId: input.checkoutGroupId,
        payload: { error: res.error, amountKop },
      });
      return { ok: false, error: res.error };
    }

    const yooStatus = res.data.status;
    const status: PaymentStatus =
      yooStatus === "succeeded"
        ? "succeeded"
        : yooStatus === "canceled"
          ? "canceled"
          : yooStatus === "waiting_for_capture"
            ? "waiting_for_capture"
            : "pending";

    const cancel = cancellationFrom(res.data);
    const payment: Payment = {
      id: paymentId,
      checkoutGroupId: input.checkoutGroupId,
      amountKop,
      currency: res.data.amount.currency || "RUB",
      provider: "yookassa" as PaymentProvider,
      method: input.method ?? null,
      providerPaymentId: res.data.id,
      status,
      idempotencyKey,
      confirmationUrl: res.data.confirmation?.confirmation_url ?? null,
      customerPhone: phone ?? null,
      customerEmail: input.customerEmail ?? null,
      receipt,
      refundedKop: 0,
      refunds: [],
      errorCode: status === "canceled" ? cancel.errorCode : null,
      errorMessage: status === "canceled" ? cancel.errorMessage : null,
      createdAt: now,
      updatedAt: now,
    };
    await savePayment(payment, res.data);
    await linkOrdersToPayment(orders, payment);
    await logAudit({
      actorType: "client",
      action: "payment.created",
      targetType: "payment",
      targetId: payment.id,
      payload: {
        amountKop,
        provider: "yookassa",
        providerPaymentId: res.data.id,
        checkoutGroupId: input.checkoutGroupId,
        test: res.data.test ?? false,
      },
    });
    return { ok: true, payment, demo: false };
  }

  // Demo-режим: без креден ЮKassa. Создаём платёж локально, после редиректа
  // на /api/payments/yookassa/demo-callback он перейдёт в succeeded.
  const demoConfirmUrl = `${publicSiteUrl()}/api/payments/yookassa/demo-callback?paymentId=${encodeURIComponent(
    paymentId
  )}&returnUrl=${encodeURIComponent(returnUrl)}`;
  const payment: Payment = {
    id: paymentId,
    checkoutGroupId: input.checkoutGroupId,
    amountKop,
    currency: "RUB",
    provider: "yookassa",
    method: input.method ?? null,
    providerPaymentId: `demo-${paymentId}`,
    status: "pending",
    idempotencyKey,
    confirmationUrl: demoConfirmUrl,
    customerPhone: phone ?? null,
    customerEmail: input.customerEmail ?? null,
    receipt,
    refundedKop: 0,
    refunds: [],
    errorCode: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
  await savePayment(payment, { demo: true });
  await linkOrdersToPayment(orders, payment);
  await logAudit({
    actorType: "system",
    action: "payment.created",
    targetType: "payment",
    targetId: payment.id,
    payload: { amountKop, provider: "demo", checkoutGroupId: input.checkoutGroupId },
  });
  return { ok: true, payment, demo: true };
}

async function linkOrdersToPayment(
  orders: Array<{ id: string; paymentId?: string; paymentStatus?: PaymentStatus }>,
  payment: Payment
): Promise<void> {
  for (const o of orders) {
    if (o.paymentId === payment.id && o.paymentStatus === payment.status) continue;
    await saveOrder({
      ...(o as unknown as import("@/lib/types").Order),
      paymentId: payment.id,
      paymentStatus: payment.status,
    });
  }
}

/**
 * Применить полученный от ЮKassa (или demo) платёж: обновить статус
 * платежа и зеркальный paymentStatus у всех связанных orders.
 */
export async function applyPaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  raw?: unknown
): Promise<Payment | undefined> {
  const prev = await getPaymentById(paymentId);
  // При отмене сохраняем причину из ЮKassa (cancellation_details.reason).
  const error =
    status === "canceled" ? cancellationFromRaw(raw) : undefined;
  const updated = await updatePaymentStatus(paymentId, status, raw, error);
  if (!updated) return undefined;
  const orders = await listOrdersByCheckoutGroup(updated.checkoutGroupId);
  for (const o of orders) {
    await saveOrder({ ...o, paymentId: updated.id, paymentStatus: status });
  }
  // При переходе pending→succeeded уведомляем клиента и продавца.
  if (status === "succeeded" && prev?.status !== "succeeded") {
    await notifyPaymentSucceeded(updated, orders);
  }
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  revalidatePath("/vendor/dashboard/orders");
  revalidatePath("/market/orders");
  return updated;
}

/**
 * Опрос статуса платежа (используется на странице возврата после редиректа).
 * Идемпотентен: можно дёргать сколько угодно.
 */
export async function refreshPaymentStatus(
  paymentId: string
): Promise<{ ok: boolean; payment?: Payment; error?: string }> {
  const payment = await getPaymentById(paymentId);
  if (!payment) return { ok: false, error: "Платёж не найден." };
  if (payment.status === "succeeded" || payment.status === "canceled") {
    return { ok: true, payment };
  }
  if (!payment.providerPaymentId || payment.providerPaymentId.startsWith("demo-")) {
    return { ok: true, payment };
  }
  if (!isYookassaConfigured()) {
    return { ok: true, payment };
  }
  const res = await yooGetPayment(payment.providerPaymentId);
  if (!res.ok) return { ok: false, error: res.error };
  const nextStatus: PaymentStatus =
    res.data.status === "succeeded"
      ? "succeeded"
      : res.data.status === "canceled"
        ? "canceled"
        : res.data.status === "waiting_for_capture"
          ? "waiting_for_capture"
          : "pending";
  if (nextStatus === payment.status) return { ok: true, payment };
  const updated = await applyPaymentStatus(payment.id, nextStatus, res.data);
  return { ok: true, payment: updated };
}

/**
 * Полный или частичный возврат. Доступно только админу.
 */
export async function refundPaymentAction(input: {
  paymentId: string;
  amountKop?: number;
  reason?: string;
}): Promise<{ ok: boolean; error?: string; payment?: Payment }> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён." };
  }
  const payment = await getPaymentById(input.paymentId);
  if (!payment) return { ok: false, error: "Платёж не найден." };
  if (payment.status !== "succeeded" && payment.status !== "partially_refunded") {
    return { ok: false, error: "Возврат возможен только для оплаченных платежей." };
  }
  const remaining = payment.amountKop - payment.refundedKop;
  const amountKop = input.amountKop ?? remaining;
  if (amountKop <= 0 || amountKop > remaining) {
    return { ok: false, error: "Некорректная сумма возврата." };
  }

  // Реальный refund через ЮKassa (если сконфигурирован и не demo-платёж).
  let refundProviderId = `local-refund-${Date.now()}`;
  if (
    isYookassaConfigured() &&
    payment.providerPaymentId &&
    !payment.providerPaymentId.startsWith("demo-")
  ) {
    const res = await yooCreateRefund({
      paymentId: payment.providerPaymentId,
      amountKop,
      description: input.reason,
      idempotencyKey: newIdempotencyKey(),
    });
    if (!res.ok) return { ok: false, error: res.error };
    refundProviderId = res.data.id;
  }

  const updated = await appendRefund(payment.id, {
    id: refundProviderId,
    amountKop,
    reason: input.reason ?? null,
    createdAt: new Date().toISOString(),
  });
  if (!updated) return { ok: false, error: "Не удалось сохранить возврат." };

  // Зеркалим статус на orders.
  const orders = await listOrdersByCheckoutGroup(updated.checkoutGroupId);
  for (const o of orders) {
    await saveOrder({ ...o, paymentStatus: updated.status });
  }

  await notifyPaymentRefunded(updated, amountKop, orders);

  await logAudit({
    actorType: "admin",
    action: "payment.refunded",
    targetType: "payment",
    targetId: updated.id,
    payload: { amountKop, reason: input.reason ?? null },
  });
  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${updated.id}`);
  return { ok: true, payment: updated };
}

/**
 * Webhook-обработчик: получили событие от ЮKassa, нашли платёж по
 * provider_payment_id, обновили статус, аудит-лог.
 */
export async function handleYookassaWebhook(payload: {
  event: string;
  object: {
    id: string;
    status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
    paid?: boolean;
    metadata?: Record<string, string>;
    cancellation_details?: { party?: string; reason?: string };
  };
}): Promise<{ ok: boolean; error?: string }> {
  const providerId = payload.object.id;
  const payment = await getPaymentByProviderId(providerId);
  if (!payment) {
    await logAudit({
      actorType: "system",
      action: "payment.webhook_unknown",
      targetType: "payment",
      targetId: providerId,
      payload: { event: payload.event },
    });
    return { ok: false, error: "payment not found" };
  }

  const nextStatus: PaymentStatus =
    payload.object.status === "succeeded"
      ? "succeeded"
      : payload.object.status === "canceled"
        ? "canceled"
        : payload.object.status === "waiting_for_capture"
          ? "waiting_for_capture"
          : "pending";

  if (nextStatus !== payment.status) {
    await applyPaymentStatus(payment.id, nextStatus, payload);
  }
  await logAudit({
    actorType: "system",
    action: `payment.webhook.${payload.event}`,
    targetType: "payment",
    targetId: payment.id,
    payload: { providerId, status: payload.object.status },
  });
  return { ok: true };
}
