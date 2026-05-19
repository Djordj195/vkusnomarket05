"use server";

import { revalidatePath } from "next/cache";
import { setCurrentCity } from "./current-city";
import { isAdminAuthenticated } from "./admin-auth";
import { updateCityStatus } from "./cities-store";
import type { CityStatus } from "@/lib/types";

/**
 * Server action: меняет выбранный клиентом город.
 * Вызывается из CityPicker (client component) через <form action={...}>
 * или programmatically через `useTransition`.
 */
export async function selectCityAction(formData: FormData): Promise<void> {
  const cityId = String(formData.get("cityId") ?? "");
  if (!cityId) return;
  await setCurrentCity(cityId);
  // Обновляем главную, каталог и все ключевые страницы.
  revalidatePath("/", "layout");
}

const VALID_STATUSES: CityStatus[] = ["active", "coming_soon", "disabled"];

export type UpdateCityStatusResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Админ-действие: меняет статус города. Используется на /admin/cities,
 * например чтобы переключить Махачкалу из `coming_soon` в `active`.
 */
export async function updateCityStatusAction(
  formData: FormData
): Promise<UpdateCityStatusResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Нет прав." };
  }
  const cityId = String(formData.get("cityId") ?? "");
  const status = String(formData.get("status") ?? "") as CityStatus;
  if (!cityId) return { ok: false, error: "Не указан город." };
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Недопустимый статус." };
  }
  try {
    await updateCityStatus(cityId, status);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Ошибка БД.",
    };
  }
  revalidatePath("/admin/cities");
  revalidatePath("/", "layout");
  return { ok: true };
}
