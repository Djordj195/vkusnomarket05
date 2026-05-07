"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} from "./products-store";
import type { Product, SourceType } from "@/lib/types";

export type ProductFormInput = {
  slug: string;
  name: string;
  source: SourceType;
  categoryId: string;
  shopId?: string;
  price: number;
  oldPrice?: number;
  unit: string;
  image: string;
  description: string;
  inStock: boolean;
  weight?: string;
  isWeekly: boolean;
};

type Result =
  | { ok: true; product?: Product }
  | { ok: false; error: string };

function validate(input: ProductFormInput): string | null {
  if (!input.name.trim()) return "Укажите название товара.";
  if (!input.slug.trim()) return "Укажите slug (латиницей через дефис).";
  if (!/^[a-z0-9-]+$/.test(input.slug))
    return "Slug должен содержать только латинские буквы, цифры и дефис.";
  if (!input.unit.trim()) return "Укажите единицу измерения (кг, шт, порция…).";
  if (!input.image.trim()) return "Укажите ссылку на фото.";
  if (!input.categoryId.trim()) return "Выберите категорию.";
  if (!Number.isFinite(input.price) || input.price < 0)
    return "Цена должна быть неотрицательным числом.";
  if (
    input.oldPrice !== undefined &&
    (!Number.isFinite(input.oldPrice) || input.oldPrice < 0)
  )
    return "Старая цена должна быть неотрицательным числом.";
  return null;
}

export async function createProductAction(
  input: ProductFormInput
): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  const err = validate(input);
  if (err) return { ok: false, error: err };

  try {
    const product = await createProduct({
      slug: input.slug.trim(),
      name: input.name.trim(),
      source: input.source,
      categoryId: input.categoryId,
      shopId: input.shopId?.trim() || undefined,
      price: Math.round(input.price),
      oldPrice:
        input.oldPrice != null ? Math.round(input.oldPrice) : undefined,
      unit: input.unit.trim(),
      image: input.image.trim(),
      description: input.description.trim(),
      inStock: input.inStock,
      weight: input.weight?.trim() || undefined,
      isWeekly: input.isWeekly,
    });
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath(`/product/${product.slug}`);
    return { ok: true, product };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось создать товар",
    };
  }
}

export async function updateProductAction(
  id: string,
  input: ProductFormInput
): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  const err = validate(input);
  if (err) return { ok: false, error: err };

  try {
    const product = await updateProduct(id, {
      slug: input.slug.trim(),
      name: input.name.trim(),
      source: input.source,
      categoryId: input.categoryId,
      shopId: input.shopId?.trim() || undefined,
      price: Math.round(input.price),
      oldPrice:
        input.oldPrice != null ? Math.round(input.oldPrice) : undefined,
      unit: input.unit.trim(),
      image: input.image.trim(),
      description: input.description.trim(),
      inStock: input.inStock,
      weight: input.weight?.trim() || undefined,
      isWeekly: input.isWeekly,
    });
    if (!product) return { ok: false, error: "Товар не найден" };
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath(`/product/${product.slug}`);
    return { ok: true, product };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось обновить товар",
    };
  }
}

export async function deleteProductAction(id: string): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  try {
    const ok = await deleteProduct(id);
    if (!ok) return { ok: false, error: "Товар не найден" };
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось удалить товар",
    };
  }
}

export async function setProductWeeklyAction(
  id: string,
  isWeekly: boolean
): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  try {
    const existing = await getProductById(id);
    if (!existing) return { ok: false, error: "Товар не найден" };
    const product = await updateProduct(id, { isWeekly });
    if (!product) return { ok: false, error: "Товар не найден" };
    revalidatePath("/admin/weekly");
    revalidatePath("/admin/products");
    revalidatePath("/weekly");
    revalidatePath("/");
    revalidatePath(`/product/${product.slug}`);
    return { ok: true, product };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось обновить товар",
    };
  }
}
