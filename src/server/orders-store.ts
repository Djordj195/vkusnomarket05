import "server-only";
import type {
  CourierStage,
  DeliveryKind,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types";
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
  // Phase 4 columns (nullable for rows created before migration 0008)
  vendor_id: string | null;
  delivery_kind: DeliveryKind | null;
  desired_at: string | null;
  checkout_group_id: string | null;
  // Phase 5 column (nullable for rows created before migration 0009)
  courier_stage: CourierStage | null;
  // Phase 8 columns (nullable for rows created before migration 0012)
  payment_id: string | null;
  payment_status: PaymentStatus | null;
  // Phase 11 columns (nullable for rows created before migration 0015)
  discount_total: number | null;
  promo_code_id: string | null;
  promo_code: string | null;
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
    vendorId: row.vendor_id ?? undefined,
    deliveryKind: row.delivery_kind ?? undefined,
    desiredAt: row.desired_at ?? undefined,
    checkoutGroupId: row.checkout_group_id ?? undefined,
    courierStage: row.courier_stage ?? undefined,
    paymentId: row.payment_id ?? undefined,
    paymentStatus: row.payment_status ?? undefined,
    discountTotal: row.discount_total ?? undefined,
    promoCodeId: row.promo_code_id ?? undefined,
    promoCode: row.promo_code ?? undefined,
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
    vendor_id: o.vendorId ?? null,
    delivery_kind: o.deliveryKind ?? null,
    desired_at: o.desiredAt ?? null,
    checkout_group_id: o.checkoutGroupId ?? null,
    courier_stage: o.courierStage ?? null,
    payment_id: o.paymentId ?? null,
    payment_status: o.paymentStatus ?? null,
    discount_total: o.discountTotal ?? null,
    promo_code_id: o.promoCodeId ?? null,
    promo_code: o.promoCode ?? null,
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

/**
 * Заказы конкретного продавца — используется в кабинете продавца.
 * Phase 4: возвращает только заказы с заполненным `vendor_id`. Старые
 * (до миграции 0008) сюда не попадают.
 */
export async function listOrdersByVendor(vendorId: string): Promise<Order[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`listOrdersByVendor: ${error.message}`);
    return (data as OrderRow[]).map(rowToOrder);
  }
  return [...getMemoryStore().orders]
    .filter((o) => o.vendorId === vendorId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Все заказы из одной checkout-группы (multi-vendor split). Используется
 * на странице подтверждения, чтобы показать все созданные заказы скопом.
 */
export async function listOrdersByCheckoutGroup(
  groupId: string
): Promise<Order[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .eq("checkout_group_id", groupId)
      .order("created_at", { ascending: true });
    if (error)
      throw new Error(`listOrdersByCheckoutGroup: ${error.message}`);
    return (data as OrderRow[]).map(rowToOrder);
  }
  return [...getMemoryStore().orders]
    .filter((o) => o.checkoutGroupId === groupId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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

/**
 * Phase 5: активные заказы курьера. Статус заказа на платформе — `courier`
 * (то есть передан курьеру). Терминальные courier_stage (completed/failed)
 * сюда не попадают — для них используется listOrderHistoryByCourier.
 */
export async function listActiveOrdersByCourier(
  courierId: string
): Promise<Order[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .eq("courier_id", courierId)
      .eq("status", "courier")
      .order("created_at", { ascending: false });
    if (error)
      throw new Error(`listActiveOrdersByCourier: ${error.message}`);
    return (data as OrderRow[]).map(rowToOrder);
  }
  return [...getMemoryStore().orders]
    .filter((o) => o.courierId === courierId && o.status === "courier")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Phase 5: история курьера — доставленные и отменённые заказы, на которые
 * он был назначен.
 */
export async function listOrderHistoryByCourier(
  courierId: string
): Promise<Order[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .eq("courier_id", courierId)
      .in("status", ["delivered", "cancelled"])
      .order("created_at", { ascending: false });
    if (error)
      throw new Error(`listOrderHistoryByCourier: ${error.message}`);
    return (data as OrderRow[]).map(rowToOrder);
  }
  return [...getMemoryStore().orders]
    .filter(
      (o) =>
        o.courierId === courierId &&
        (o.status === "delivered" || o.status === "cancelled")
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Phase 5: курьер сообщает о новом этапе доставки. completed → переводит
 * макро-статус заказа в `delivered`. failed → `cancelled`. Остальные этапы
 * не трогают макро-статус.
 */
export async function updateCourierStage(
  id: string,
  stage: CourierStage
): Promise<Order | undefined> {
  const nextMacroStatus: OrderStatus | null =
    stage === "completed"
      ? "delivered"
      : stage === "failed"
        ? "cancelled"
        : null;

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const patch: {
      courier_stage: CourierStage;
      status?: OrderStatus;
    } = { courier_stage: stage };
    if (nextMacroStatus) patch.status = nextMacroStatus;
    const { data, error } = await sb
      .from("orders")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`updateCourierStage: ${error.message}`);
    return data ? rowToOrder(data as OrderRow) : undefined;
  }
  const order = getMemoryStore().orders.find((o) => o.id === id);
  if (!order) return undefined;
  order.courierStage = stage;
  if (nextMacroStatus) order.status = nextMacroStatus;
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
