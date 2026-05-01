import "server-only";
import type { Order, OrderStatus } from "@/lib/types";

// Простое хранилище в памяти процесса. Подходит для разработки и
// демо-превью. Когда будет подключена база данных (Supabase), эта реализация
// заменится на запросы к БД, а внешний интерфейс останется тем же.
//
// На Vercel serverless при холодном старте память сбрасывается. Это
// нормально для MVP — основным «архивом» заказов на старте служит
// Telegram-уведомление администратору.

type Store = {
  orders: Order[];
};

const globalKey = "__VKUSNOMARKET_ORDERS_STORE__";

function getStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[globalKey]) {
    g[globalKey] = { orders: [] };
  }
  return g[globalKey]!;
}

export async function listOrders(): Promise<Order[]> {
  return [...getStore().orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  return getStore().orders.find((o) => o.id === id);
}

export async function saveOrder(order: Order): Promise<Order> {
  const store = getStore();
  const idx = store.orders.findIndex((o) => o.id === order.id);
  if (idx === -1) {
    store.orders.unshift(order);
  } else {
    store.orders[idx] = order;
  }
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  courierId?: string
): Promise<Order | undefined> {
  const store = getStore();
  const order = store.orders.find((o) => o.id === id);
  if (!order) return undefined;
  order.status = status;
  if (courierId !== undefined) order.courierId = courierId;
  return order;
}

export async function assignCourier(
  id: string,
  courierId: string
): Promise<Order | undefined> {
  const store = getStore();
  const order = store.orders.find((o) => o.id === id);
  if (!order) return undefined;
  order.courierId = courierId;
  if (order.status === "preparing" || order.status === "accepted") {
    order.status = "courier";
  }
  return order;
}
