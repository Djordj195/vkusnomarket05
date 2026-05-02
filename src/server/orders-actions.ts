"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import {
  saveOrder,
  updateOrderStatus as updateOrderStatusInStore,
  assignCourier as assignCourierInStore,
} from "./orders-store";
import { getProductById } from "./products-store";
import { notifyAdminNewOrder } from "./telegram";
import { generateOrderNumber } from "@/lib/utils";
import {
  DELIVERY_FEE,
  MIN_ORDER_AMOUNT,
} from "@/lib/constants";
import type { Order, OrderItem, OrderStatus, PaymentMethod } from "@/lib/types";

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  address: string;
  comment?: string;
  payment: PaymentMethod;
  geo?: { lat: number; lng: number };
  items: Array<{ productId: string; quantity: number }>;
};

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; error: string };

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
  if (!input.address.trim()) {
    return { ok: false, error: "Укажите адрес доставки." };
  }
  if (input.items.length === 0) {
    return { ok: false, error: "Корзина пуста." };
  }

  const orderItems: OrderItem[] = [];
  for (const it of input.items) {
    const product = await getProductById(it.productId);
    if (!product) {
      return {
        ok: false,
        error: `Товар не найден: ${it.productId}`,
      };
    }
    if (it.quantity <= 0) continue;
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: it.quantity,
      unit: product.unit,
      image: product.image,
    });
  }

  if (orderItems.length === 0) {
    return { ok: false, error: "Корзина пуста." };
  }

  const subtotal = orderItems.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  );

  if (subtotal < MIN_ORDER_AMOUNT) {
    return {
      ok: false,
      error: `Минимальная сумма заказа — ${MIN_ORDER_AMOUNT} ₽.`,
    };
  }

  if (input.payment === "card") {
    return {
      ok: false,
      error: "Оплата картой временно недоступна. Выберите оплату наличными.",
    };
  }

  const order: Order = {
    id: `o-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    number: generateOrderNumber(),
    createdAt: new Date().toISOString(),
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    address: input.address.trim(),
    comment: input.comment?.trim() || undefined,
    geo: input.geo,
    payment: input.payment,
    items: orderItems,
    subtotal,
    deliveryFee: DELIVERY_FEE,
    total: subtotal + DELIVERY_FEE,
    status: "accepted",
  };

  await saveOrder(order);
  await notifyAdminNewOrder(order);
  revalidatePath("/admin/orders");

  return { ok: true, order };
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
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
