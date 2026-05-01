import "server-only";
import type { Courier } from "@/lib/types";

type Store = {
  couriers: Courier[];
};

const globalKey = "__VKUSNOMARKET_COURIERS_STORE__";

function getStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[globalKey]) {
    // Стартовые курьеры для демонстрации. Можно удалить и добавить своих
    // через админ-панель. Телефоны заменятся на реальные.
    g[globalKey] = {
      couriers: [
        { id: "c-1", name: "Курьер №1", phone: "+7 (999) 000-00-01", isActive: true },
        { id: "c-2", name: "Курьер №2", phone: "+7 (999) 000-00-02", isActive: true },
      ],
    };
  }
  return g[globalKey]!;
}

export async function listCouriers(): Promise<Courier[]> {
  return [...getStore().couriers];
}

export async function getCourierById(id: string): Promise<Courier | undefined> {
  return getStore().couriers.find((c) => c.id === id);
}

export async function addCourier(c: Omit<Courier, "id">): Promise<Courier> {
  const store = getStore();
  const courier: Courier = { id: `c-${Date.now()}`, ...c };
  store.couriers.push(courier);
  return courier;
}

export async function updateCourier(
  id: string,
  patch: Partial<Omit<Courier, "id">>
): Promise<Courier | undefined> {
  const store = getStore();
  const c = store.couriers.find((x) => x.id === id);
  if (!c) return undefined;
  Object.assign(c, patch);
  return c;
}

export async function removeCourier(id: string): Promise<boolean> {
  const store = getStore();
  const before = store.couriers.length;
  store.couriers = store.couriers.filter((c) => c.id !== id);
  return store.couriers.length < before;
}
