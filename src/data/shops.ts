import type { Shop } from "@/lib/types";

// Раздел "Лавки" пока пустой — пользователь будет добавлять продавцов
// сам через админ-панель. По ТЗ: "тут пусть будет пустой список,
// по мере развития я сам буду добавлять продавцов".
export const SHOPS: Shop[] = [];

export function getShopsBySource(source: Shop["source"]): Shop[] {
  return SHOPS.filter((s) => s.source === source);
}

export function getShopById(id: string): Shop | undefined {
  return SHOPS.find((s) => s.id === id);
}
