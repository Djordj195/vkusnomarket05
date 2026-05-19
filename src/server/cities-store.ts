import "server-only";
import type { City, CityStatus } from "@/lib/types";
import { CITIES as STATIC_CITIES, DEFAULT_CITY_ID } from "@/data/cities";
import {
  getSupabaseAdmin,
  isMissingTableError,
  isSupabaseConfigured,
} from "./supabase";

type CityRow = {
  id: string;
  slug: string;
  name: string;
  region: string;
  region_type: string;
  federal_district: string;
  timezone: string;
  lat: number;
  lng: number;
  population: number | null;
  status: CityStatus;
  sort_order: number;
};

function rowToCity(r: CityRow): City {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    region: r.region,
    regionType: r.region_type,
    federalDistrict: r.federal_district,
    timezone: r.timezone,
    lat: r.lat,
    lng: r.lng,
    population: r.population ?? undefined,
    status: r.status,
    sortOrder: r.sort_order,
  };
}

export async function listCities(): Promise<City[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("cities")
      .select("*")
      .neq("status", "disabled")
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTableError(error)) return [...STATIC_CITIES];
      throw new Error(`listCities: ${error.message}`);
    }
    return (data as CityRow[]).map(rowToCity);
  }
  return [...STATIC_CITIES];
}

/**
 * Полный список городов (включая `disabled`). Используется только в админке.
 */
export async function listAllCities(): Promise<City[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("cities")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTableError(error)) return [...STATIC_CITIES];
      throw new Error(`listAllCities: ${error.message}`);
    }
    return (data as CityRow[]).map(rowToCity);
  }
  return [...STATIC_CITIES];
}

export async function updateCityStatus(
  id: string,
  status: CityStatus
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "updateCityStatus: Supabase не настроен. Применить миграцию 0005."
    );
  }
  const sb = getSupabaseAdmin()!;
  const { error } = await sb
    .from("cities")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(`updateCityStatus: ${error.message}`);
}

export async function getCityById(id: string): Promise<City | undefined> {
  const all = await listCities();
  return all.find((c) => c.id === id);
}

export async function getCityBySlug(slug: string): Promise<City | undefined> {
  const all = await listCities();
  return all.find((c) => c.slug === slug);
}

export async function getDefaultCity(): Promise<City> {
  const def = await getCityById(DEFAULT_CITY_ID);
  if (def) return def;
  // Защита: если по какой-то причине дефолтного города нет — берём первый
  // активный, иначе первый из списка.
  const all = await listCities();
  return all.find((c) => c.status === "active") ?? all[0] ?? STATIC_CITIES[0];
}

/**
 * Подбирает ближайший к координатам город (по простому расстоянию в градусах).
 * Используется для геолокации в браузере.
 */
export async function findNearestCity(
  lat: number,
  lng: number
): Promise<City | undefined> {
  const all = await listCities();
  if (all.length === 0) return undefined;
  let best: City | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const c of all) {
    const dLat = c.lat - lat;
    const dLng = c.lng - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      best = c;
      bestDist = dist;
    }
  }
  return best;
}
