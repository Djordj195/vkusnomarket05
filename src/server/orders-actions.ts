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
import {
  notifyCourierAssigned,
  notifyOrderCreated,
  notifyOrderStatusChanged,
} from "./notifications/events";
import { generateOrderNumber } from "@/lib/utils";
import { DELIVERY_FEE } from "@/lib/constants";
import { validatePromoCode } from "./promo/validate";
import {
  appendRedemption,
  getPromoById,
  savePromo,
} from "./promo/promo-store";
import type {
  DeliveryKind,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PromoDiscountBreakdown,
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
  /** Phase 11: применённый промокод (опционально). Валидируется на сервере перед сохранением. */
  promoCode?: string | null;
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

  // Phase 11: если передан промокод — пере-валидируем его на сервере, чтобы
  // клиент не мог подсунуть произвольную скидку. Если промокод невалиден —
  // возвращаем ошибку, заказ не создаём.
  let promoBreakdown: PromoDiscountBreakdown[] = [];
  let promoCodeApplied: { id: string; code: string } | null = null;
  if (input.promoCode && input.promoCode.trim()) {
    const validation = await validatePromoCode({
      code: input.promoCode,
      customerPhone: input.customerPhone,
      items: input.items,
      deliveryFee: deliveryKind === "pickup" ? 0 : DELIVERY_FEE,
      deliveryKind,
    });
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }
    promoBreakdown = validation.breakdown;
    promoCodeApplied = {
      id: validation.promo.id,
      code: validation.promo.code,
    };
  }

  const breakdownByVendor = new Map<string, PromoDiscountBreakdown>();
  for (const b of promoBreakdown) {
    breakdownByVendor.set(b.vendorKey, b);
  }

  const groupId = `cg-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const now = Date.now();
  const orders: Order[] = [];

  let idx = 0;
  for (const [vendorKey, items] of buckets.entries()) {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const baseDeliveryFee = deliveryKind === "pickup" ? 0 : DELIVERY_FEE;
    const b = breakdownByVendor.get(vendorKey);
    const discountSubtotal = b?.discountSubtotal ?? 0;
    const discountShipping = b?.discountShipping ?? 0;
    const deliveryFee = Math.max(0, baseDeliveryFee - discountShipping);
    const discountTotal = discountSubtotal + discountShipping;
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
      total: Math.max(0, subtotal - discountSubtotal) + deliveryFee,
      status: "accepted",
      vendorId: vendorKey === "__unknown__" ? undefined : vendorKey,
      deliveryKind,
      desiredAt: input.desiredAt ?? undefined,
      checkoutGroupId: groupId,
      paymentStatus: input.payment === "card" ? "pending" : undefined,
      discountTotal: discountTotal > 0 ? discountTotal : undefined,
      promoCodeId: promoCodeApplied && discountTotal > 0 ? promoCodeApplied.id : undefined,
      promoCode: promoCodeApplied && discountTotal > 0 ? promoCodeApplied.code : undefined,
    };
    await saveOrder(order);
    await notifyAdminNewOrder(order);
    await notifyOrderCreated(order);

    // Phase 11: фиксируем применение промокода на split-order'е.
    if (promoCodeApplied && discountTotal > 0) {
      try {
        await appendRedemption({
          id: `pr-${now}-${idx}-${Math.floor(Math.random() * 1e6)}`,
          promoCodeId: promoCodeApplied.id,
          promoCode: promoCodeApplied.code,
          orderId: order.id,
          customerPhone: input.customerPhone.trim(),
          customerName: input.customerName.trim() || null,
          vendorId: vendorKey === "__unknown__" ? null : vendorKey,
          discountAmount: discountTotal,
          subtotal,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[promo] failed to record redemption", err);
      }
    }

    orders.push(order);
    idx += 1;
  }

  // Phase 11: после создания всех заказов один раз обновляем счётчики промокода.
  if (promoCodeApplied) {
    try {
      const totalDiscount = orders.reduce(
        (s, o) => s + (o.discountTotal ?? 0),
        0
      );
      const existing = await getPromoById(promoCodeApplied.id);
      if (existing) {
        await savePromo({
          ...existing,
          usedCount: existing.usedCount + 1,
          totalDiscount: existing.totalDiscount + totalDiscount,
          updatedAt: new Date().toISOString(),
        });
      }
      await logAudit({
        actorType: "client",
        actorLabel: input.customerPhone.trim(),
        action: "promo.redeemed",
        targetType: "promo",
        targetId: promoCodeApplied.id,
        payload: {
          code: promoCodeApplied.code,
          groupId,
          discount: totalDiscount,
        },
      });
    } catch (err) {
      console.error("[promo] failed to update counters", err);
    }
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
  await notifyOrderStatusChanged(updated);
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
  await notifyCourierAssigned(updated);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
