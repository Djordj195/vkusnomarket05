"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import { logAudit } from "./audit-store";
import {
  saveOrder,
  updateOrderStatus as updateOrderStatusInStore,
  assignCourier as assignCourierInStore,
} from "./orders-store";
import { getProductById } from "./products-store";
import { notifyAdminNewOrder } from "./telegram";
import { generateOrderNumber } from "@/lib/utils";
import { DELIVERY_FEE } from "@/lib/constants";
import type {
  DeliveryKind,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from "@/lib/types";

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  address: string;
  comment?: string;
  payment: PaymentMethod;
  geo?: { lat: number; lng: number };
  /** Phase 4: тип доставки (доставка курьером или самовывоз). */
  deliveryKind?: DeliveryKind;
  /** Phase 4: желаемое время. ISO-строка; null/undefined = «как можно скорее». */
  desiredAt?: string | null;
  items: Array<{ productId: string; quantity: number }>;
};

export type CreateOrderResult =
  | { ok: true; orders: Order[]; groupId: string }
  | { ok: false; error: string };

/** Backwards-compatible helper for legacy single-order code paths. */
export type LegacyCreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; error: string };

/**
 * Phase 4: чек-аут продюсирует **по одному заказу на каждого продавца**.
 *
 * 1. Резолвим каждую позицию через products-store — берём актуальную цену,
 *    название и фото на момент покупки (snapshot).
 * 2. Группируем по `product.vendorId`. Если у позиции нет vendorId
 *    (статический seed, легаси), кладём в группу `__unknown__` — такая
 *    группа создаст один общий заказ без vendor_id.
 * 3. Доставка считается на каждый заказ отдельно: для самовывоза 0, для
 *    доставки — фиксированная DELIVERY_FEE из конфига (Phase 6 переедет
 *    в тарифы продавца).
 * 4. Все заказы получают общий `checkoutGroupId`, чтобы UI мог их
 *    группировать на странице подтверждения.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  if (!input.customerName.trim()) {
    return { ok: false, error: "Укажите имя." };
  }
  const phoneDigits = input.customerPhone.replace(/\D/g, "");
  if (phoneDigits.length < 11) {
    return { ok: false, error: "Укажите корректный номер телефона." };
  }
  const deliveryKind: DeliveryKind = input.deliveryKind ?? "delivery";
  if (deliveryKind === "delivery" && !input.address.trim()) {
    return { ok: false, error: "Укажите адрес доставки." };
  }
  if (input.items.length === 0) {
    return { ok: false, error: "Корзина пуста." };
  }
  if (input.payment === "card") {
    return {
      ok: false,
      error: "Оплата картой временно недоступна. Выберите оплату наличными.",
    };
  }

  // Группируем позиции по vendorId, попутно резолвя каждую через store.
  const buckets = new Map<string, OrderItem[]>();
  for (const it of input.items) {
    if (it.quantity <= 0) continue;
    const product = await getProductById(it.productId);
    if (!product) {
      return {
        ok: false,
        error: `Товар не найден: ${it.productId}`,
      };
    }
    const key = product.vendorId ?? "__unknown__";
    const bucket = buckets.get(key) ?? [];
    bucket.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: it.quantity,
      unit: product.unit,
      image: product.image,
    });
    buckets.set(key, bucket);
  }

  if (buckets.size === 0) {
    return { ok: false, error: "Корзина пуста." };
  }

  const groupId = `cg-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const now = Date.now();
  const orders: Order[] = [];

  let idx = 0;
  for (const [vendorKey, items] of buckets.entries()) {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = deliveryKind === "pickup" ? 0 : DELIVERY_FEE;
    const order: Order = {
      id: `o-${now}-${idx}-${Math.floor(Math.random() * 1e6)}`,
      number: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      address:
        deliveryKind === "pickup"
          ? ""
          : input.address.trim(),
      comment: input.comment?.trim() || undefined,
      geo: input.geo,
      payment: input.payment,
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      status: "accepted",
      vendorId: vendorKey === "__unknown__" ? undefined : vendorKey,
      deliveryKind,
      desiredAt: input.desiredAt ?? undefined,
      checkoutGroupId: groupId,
    };
    await saveOrder(order);
    await notifyAdminNewOrder(order);
    orders.push(order);
    idx += 1;
  }

  revalidatePath("/admin/orders");
  revalidatePath("/vendor/dashboard/orders");
  revalidatePath("/orders");

  return { ok: true, orders, groupId };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  const updated = await updateOrderStatusInStore(orderId, status);
  if (!updated) return { ok: false, error: "Заказ не найден" };
  await logAudit({
    actorType: "admin",
    action: "order.status_change",
    targetType: "order",
    targetId: orderId,
    payload: { status },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function assignCourier(
  orderId: string,
  courierId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  const updated = await assignCourierInStore(orderId, courierId);
  if (!updated) return { ok: false, error: "Заказ не найден" };
  await logAudit({
    actorType: "admin",
    action: "order.assign_courier",
    targetType: "order",
    targetId: orderId,
    payload: { courierId },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
