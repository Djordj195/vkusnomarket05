import "server-only";
import { cookies } from "next/headers";
import type { City } from "@/lib/types";
import { DEFAULT_CITY_ID } from "@/data/cities";
import { getCityById, getDefaultCity, listCities } from "./cities-store";

export const CITY_COOKIE = "vm_city_id";
const CITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 год

/**
 * Возвращает текущий выбранный клиентом город. По умолчанию — Кизляр.
 * Если в куке стоит несуществующий ID — возвращаем дефолт.
 */
export async function getCurrentCity(): Promise<City> {
  const c = await cookies();
  const stored = c.get(CITY_COOKIE)?.value;
  if (stored) {
    const found = await getCityById(stored);
    if (found) return found;
  }
  return getDefaultCity();
}

/**
 * Записывает выбранный город в куку. Вызывается из server action.
 */
export async function setCurrentCity(cityId: string): Promise<City> {
  const all = await listCities();
  const target =
    all.find((c) => c.id === cityId) ??
    all.find((c) => c.id === DEFAULT_CITY_ID) ??
    all[0];
  if (!target) throw new Error("Список городов пуст");
  const c = await cookies();
  c.set(CITY_COOKIE, target.id, {
    sameSite: "lax",
    maxAge: CITY_COOKIE_MAX_AGE,
    path: "/",
  });
  return target;
}
