"use server";

import { isAdminAuthenticated } from "./admin-auth";
import { getOrderById } from "./orders-store";
import type { Order } from "@/lib/types";

export async function getMaskedOrderAction(
  orderId: string
): Promise<Order | null> {
  if (!(await isAdminAuthenticated())) return null;
  const order = await getOrderById(orderId);
  return order ?? null;
}
