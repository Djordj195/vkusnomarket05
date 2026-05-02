import "server-only";
import type { Courier } from "@/lib/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

// Двухрежимное хранилище курьеров: Supabase (при наличии env) либо память.

type CourierRow = {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
};

function rowToCourier(r: CourierRow): Courier {
  return { id: r.id, name: r.name, phone: r.phone, isActive: r.is_active };
}

type Store = { couriers: Courier[] };
const globalKey = "__VKUSNOMARKET_COURIERS_STORE__";

function getMemoryStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[globalKey]) {
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
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("couriers")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(`listCouriers: ${error.message}`);
    return (data as CourierRow[]).map(rowToCourier);
  }
  return [...getMemoryStore().couriers];
}

export async function getCourierById(id: string): Promise<Courier | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("couriers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`getCourierById: ${error.message}`);
    return data ? rowToCourier(data as CourierRow) : undefined;
  }
  return getMemoryStore().couriers.find((c) => c.id === id);
}

export async function addCourier(c: Omit<Courier, "id">): Promise<Courier> {
  const courier: Courier = { id: `c-${Date.now()}`, ...c };
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb.from("couriers").insert({
      id: courier.id,
      name: courier.name,
      phone: courier.phone,
      is_active: courier.isActive,
    });
    if (error) throw new Error(`addCourier: ${error.message}`);
    return courier;
  }
  getMemoryStore().couriers.push(courier);
  return courier;
}

export async function updateCourier(
  id: string,
  patch: Partial<Omit<Courier, "id">>
): Promise<Courier | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const dbPatch: Partial<CourierRow> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;
    const { data, error } = await sb
      .from("couriers")
      .update(dbPatch)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`updateCourier: ${error.message}`);
    return data ? rowToCourier(data as CourierRow) : undefined;
  }
  const c = getMemoryStore().couriers.find((x) => x.id === id);
  if (!c) return undefined;
  Object.assign(c, patch);
  return c;
}

export async function removeCourier(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error, count } = await sb
      .from("couriers")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw new Error(`removeCourier: ${error.message}`);
    return (count ?? 0) > 0;
  }
  const store = getMemoryStore();
  const before = store.couriers.length;
  store.couriers = store.couriers.filter((c) => c.id !== id);
  return store.couriers.length < before;
}
