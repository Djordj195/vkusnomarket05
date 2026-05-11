"use server";

import { revalidatePath } from "next/cache";
import { setCurrentCity } from "./current-city";

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
