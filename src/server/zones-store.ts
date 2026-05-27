import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type { DeliveryZone, DeliveryZonePoint } from "@/lib/types";

// Phase 6: store зон доставки. Полигон хранится в Supabase в jsonb-поле
// `polygon` как массив координат `{lat, lng}` (наш собственный формат —
// не GeoJSON, чтобы UI/админ Leaflet не нужно было оборачивать).

type Row = {
  id: string;
  vendor_id: string;
  name: string | null;
  polygon: DeliveryZonePoint[];
  min_order: number;
  delivery_fee: number;
  free_from: number | null;
  eta_min: number;
  eta_max: number;
  is_active: boolean;
  created_at: string;
};

function rowToZone(r: Row): DeliveryZone {
  return {
    id: r.id,
    vendorId: r.vendor_id,
    name: r.name && r.name.trim().length > 0 ? r.name : "Зона доставки",
    polygon: Array.isArray(r.polygon) ? r.polygon : [],
    minOrder: r.min_order,
    deliveryFee: r.delivery_fee,
    freeFrom: r.free_from,
    etaMin: r.eta_min,
    etaMax: r.eta_max,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

type MemoryStore = { zones: DeliveryZone[] };
const globalKey = "__VKUSNOMARKET_ZONES_STORE__";

function getMemoryStore(): MemoryStore {
  const g = globalThis as unknown as Record<string, MemoryStore | undefined>;
  if (!g[globalKey]) g[globalKey] = { zones: [] };
  return g[globalKey]!;
}

export async function listZones(): Promise<DeliveryZone[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("delivery_zones")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`listZones: ${error.message}`);
    return (data as Row[]).map(rowToZone);
  }
  return [...getMemoryStore().zones].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function listZonesByVendor(
  vendorId: string
): Promise<DeliveryZone[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("delivery_zones")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`listZonesByVendor: ${error.message}`);
    return (data as Row[]).map(rowToZone);
  }
  return getMemoryStore()
    .zones.filter((z) => z.vendorId === vendorId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getZone(id: string): Promise<DeliveryZone | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("delivery_zones")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`getZone: ${error.message}`);
    return data ? rowToZone(data as Row) : undefined;
  }
  return getMemoryStore().zones.find((z) => z.id === id);
}

export type SaveZoneInput = {
  id?: string;
  vendorId: string;
  name: string;
  polygon: DeliveryZonePoint[];
  minOrder: number;
  deliveryFee: number;
  freeFrom: number | null;
  etaMin: number;
  etaMax: number;
  isActive: boolean;
};

export async function saveZone(input: SaveZoneInput): Promise<DeliveryZone> {
  const id = input.id ?? `dz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const zone: DeliveryZone = {
    id,
    vendorId: input.vendorId,
    name: input.name,
    polygon: input.polygon,
    minOrder: input.minOrder,
    deliveryFee: input.deliveryFee,
    freeFrom: input.freeFrom,
    etaMin: input.etaMin,
    etaMax: input.etaMax,
    isActive: input.isActive,
    createdAt: new Date().toISOString(),
  };
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const payload = {
      id: zone.id,
      vendor_id: zone.vendorId,
      name: zone.name,
      polygon: zone.polygon,
      min_order: zone.minOrder,
      delivery_fee: zone.deliveryFee,
      free_from: zone.freeFrom,
      eta_min: zone.etaMin,
      eta_max: zone.etaMax,
      is_active: zone.isActive,
    };
    const { data, error } = await sb
      .from("delivery_zones")
      .upsert(payload)
      .select()
      .maybeSingle();
    if (error) throw new Error(`saveZone: ${error.message}`);
    return data ? rowToZone(data as Row) : zone;
  }
  const store = getMemoryStore();
  const idx = store.zones.findIndex((z) => z.id === zone.id);
  if (idx >= 0) {
    // Сохраняем оригинальный createdAt для update.
    zone.createdAt = store.zones[idx].createdAt;
    store.zones[idx] = zone;
  } else {
    store.zones.push(zone);
  }
  return zone;
}

export async function deleteZone(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb.from("delivery_zones").delete().eq("id", id);
    if (error) throw new Error(`deleteZone: ${error.message}`);
    return true;
  }
  const store = getMemoryStore();
  const idx = store.zones.findIndex((z) => z.id === id);
  if (idx < 0) return false;
  store.zones.splice(idx, 1);
  return true;
}
