"use server";

import { revalidatePath } from "next/cache";
import { getCurrentVendor } from "./vendor-auth";
import { getOrderById, updateOrderStatus } from "./orders-store";
import { notifyOrderStatusChanged } from "./notifications/events";
import type { OrderStatus } from "@/lib/types";

const VENDOR_ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  accepted: ["preparing", "cancelled"],
  preparing: ["courier"],
  courier: [],
  delivered: [],
  cancelled: [],
};

export async function vendorUpdateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ ok: boolean; error?: string }> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Необходимо войти в кабинет продавца" };

  const order = await getOrderById(orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (order.vendorId !== vendor.id) return { ok: false, error: "Это не ваш заказ" };

  const allowed = VENDOR_ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return { ok: false, error: `Нельзя сменить статус с «${order.status}» на «${newStatus}»` };
  }

  const updated = await updateOrderStatus(orderId, newStatus);
  if (!updated) return { ok: false, error: "Не удалось обновить заказ" };

  await notifyOrderStatusChanged(updated);

  revalidatePath("/vendor/dashboard/orders");
  revalidatePath(`/vendor/dashboard/orders/${orderId}`);
  revalidatePath("/admin/orders");

  return { ok: true };
}
