import "server-only";
import type { Order, OrderItem, OrderStatus, PaymentMethod } from "@/lib/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

// Двухрежимное хранилище заказов:
//   • если задан Supabase (env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
//     — все операции идут в таблицу public.orders;
//   • иначе — в память процесса (для локальной разработки и фолбэка).
//
// Внешний интерфейс модуля не меняется, чтобы остальной код мог работать
// одинаково в обоих режимах.

// ──────────────────────────────────────────────────────────────────────────
// In-memory fallback (used when Supabase env vars are missing)
// ──────────────────────────────────────────────────────────────────────────

type Store = { orders: Order[] };
const globalKey = "__VKUSNOMARKET_ORDERS_STORE__";

function getMemoryStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[globalKey]) g[globalKey] = { orders: [] };
  return g[globalKey]!;
}

// ──────────────────────────────────────────────────────────────────────────
// Supabase row mapping
// ──────────────────────────────────────────────────────────────────────────

type OrderRow = {
  id: string;
  number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  comment: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  payment: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  courier_id: string | null;
};

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    address: row.address,
    comment: row.comment ?? undefined,
    geo:
      row.geo_lat != null && row.geo_lng != null
        ? { lat: row.geo_lat, lng: row.geo_lng }
        : undefined,
    payment: row.payment,
    items: row.items,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    status: row.status,
    courierId: row.courier_id ?? undefined,
  };
}

function orderToRow(o: Order): OrderRow {
  return {
    id: o.id,
    number: o.number,
    created_at: o.createdAt,
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    address: o.address,
    comment: o.comment ?? null,
    geo_lat: o.geo?.lat ?? null,
    geo_lng: o.geo?.lng ?? null,
    payment: o.payment,
    items: o.items,
    subtotal: o.subtotal,
    delivery_fee: o.deliveryFee,
    total: o.total,
    status: o.status,
    courier_id: o.courierId ?? null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Public API (mirrors original signatures)
// ──────────────────────────────────────────────────────────────────────────

export async function listOrders(): Promise<Order[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`listOrders: ${error.message}`);
    return (data as OrderRow[]).map(rowToOrder);
  }
  return [...getMemoryStore().orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`getOrderById: ${error.message}`);
    return data ? rowToOrder(data as OrderRow) : undefined;
  }
  return getMemoryStore().orders.find((o) => o.id === id);
}

export async function saveOrder(order: Order): Promise<Order> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb.from("orders").upsert(orderToRow(order));
    if (error) throw new Error(`saveOrder: ${error.message}`);
    return order;
  }
  const store = getMemoryStore();
  const idx = store.orders.findIndex((o) => o.id === order.id);
  if (idx === -1) store.orders.unshift(order);
  else store.orders[idx] = order;
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  courierId?: string
): Promise<Order | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const patch: { status: OrderStatus; courier_id?: string | null } = {
      status,
    };
    if (courierId !== undefined) patch.courier_id = courierId || null;
    const { data, error } = await sb
      .from("orders")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`updateOrderStatus: ${error.message}`);
    return data ? rowToOrder(data as OrderRow) : undefined;
  }
  const order = getMemoryStore().orders.find((o) => o.id === id);
  if (!order) return undefined;
  order.status = status;
  if (courierId !== undefined) order.courierId = courierId;
  return order;
}

export async function assignCourier(
  id: string,
  courierId: string
): Promise<Order | undefined> {
  if (isSupabaseConfigured()) {
    const current = await getOrderById(id);
    if (!current) return undefined;
    const nextStatus: OrderStatus =
      current.status === "preparing" || current.status === "accepted"
        ? "courier"
        : current.status;
    return updateOrderStatus(id, nextStatus, courierId);
  }
  const order = getMemoryStore().orders.find((o) => o.id === id);
  if (!order) return undefined;
  order.courierId = courierId;
  if (order.status === "preparing" || order.status === "accepted") {
    order.status = "courier";
  }
  return order;
}
