"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categories-store";
import type { Category, SourceType } from "@/lib/types";

export type CategoryFormInput = {
  slug: string;
  name: string;
  source: SourceType;
  emoji: string;
  icon: string;
  highlight: boolean;
};

type Result =
  | { ok: true; category?: Category }
  | { ok: false; error: string };

function validate(input: CategoryFormInput): string | null {
  if (!input.name.trim()) return "Укажите название категории.";
  if (!input.slug.trim()) return "Укажите slug (латиницей через дефис).";
  if (!/^[a-z0-9-]+$/.test(input.slug))
    return "Slug должен содержать только латинские буквы, цифры и дефис.";
  if (!input.emoji.trim()) return "Выберите эмоджи для категории.";
  return null;
}

export async function createCategoryAction(
  input: CategoryFormInput
): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  const err = validate(input);
  if (err) return { ok: false, error: err };

  try {
    const category = await createCategory({
      slug: input.slug.trim(),
      name: input.name.trim(),
      source: input.source,
      emoji: input.emoji.trim(),
      icon: input.icon.trim() || "tag",
      itemsCount: 0,
      highlight: input.highlight,
    });
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, category };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось создать категорию",
    };
  }
}

export async function updateCategoryAction(
  id: string,
  input: CategoryFormInput
): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  const err = validate(input);
  if (err) return { ok: false, error: err };

  try {
    const category = await updateCategory(id, {
      slug: input.slug.trim(),
      name: input.name.trim(),
      source: input.source,
      emoji: input.emoji.trim(),
      icon: input.icon.trim() || "tag",
      highlight: input.highlight,
    });
    if (!category) return { ok: false, error: "Категория не найдена" };
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath(`/category/${category.slug}`);
    return { ok: true, category };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось обновить категорию",
    };
  }
}

export async function deleteCategoryAction(id: string): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  try {
    const ok = await deleteCategory(id);
    if (!ok) return { ok: false, error: "Категория не найдена" };
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось удалить категорию",
    };
  }
}
