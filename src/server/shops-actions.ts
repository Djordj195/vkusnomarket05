"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import { createShop, updateShop, deleteShop } from "./shops-store";
import type { Shop, SourceType } from "@/lib/types";

export type ShopFormInput = {
  slug: string;
  name: string;
  source: SourceType;
  description: string;
  cover: string;
  rating?: number;
  isOpen: boolean;
};

type Result = { ok: true; shop?: Shop } | { ok: false; error: string };

function validate(input: ShopFormInput): string | null {
  if (!input.name.trim()) return "Укажите название магазина.";
  if (!input.slug.trim()) return "Укажите slug (латиницей через дефис).";
  if (!/^[a-z0-9-]+$/.test(input.slug))
    return "Slug должен содержать только латинские буквы, цифры и дефис.";
  if (
    input.rating !== undefined &&
    (!Number.isFinite(input.rating) || input.rating < 0 || input.rating > 5)
  )
    return "Рейтинг должен быть числом от 0 до 5.";
  return null;
}

export async function createShopAction(
  input: ShopFormInput
): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  const err = validate(input);
  if (err) return { ok: false, error: err };

  try {
    const shop = await createShop({
      slug: input.slug.trim(),
      name: input.name.trim(),
      source: input.source,
      description: input.description.trim() || undefined,
      cover: input.cover.trim() || undefined,
      rating: input.rating,
      isOpen: input.isOpen,
    });
    revalidatePath("/admin/shops");
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, shop };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось создать магазин",
    };
  }
}

export async function updateShopAction(
  id: string,
  input: ShopFormInput
): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  const err = validate(input);
  if (err) return { ok: false, error: err };

  try {
    const shop = await updateShop(id, {
      slug: input.slug.trim(),
      name: input.name.trim(),
      source: input.source,
      description: input.description.trim() || undefined,
      cover: input.cover.trim() || undefined,
      rating: input.rating,
      isOpen: input.isOpen,
    });
    if (!shop) return { ok: false, error: "Магазин не найден" };
    revalidatePath("/admin/shops");
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, shop };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось обновить магазин",
    };
  }
}

export async function deleteShopAction(id: string): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  try {
    const ok = await deleteShop(id);
    if (!ok) return { ok: false, error: "Магазин не найден" };
    revalidatePath("/admin/shops");
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось удалить магазин",
    };
  }
}
