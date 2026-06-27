"use server";

import { revalidatePath } from "next/cache";
import { getCurrentVendor } from "./vendor-auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductsByVendor,
} from "./products-store";
import type { Product, SourceType } from "@/lib/types";

export type VendorProductFormInput = {
  name: string;
  categoryId: string;
  price: number;
  oldPrice?: number;
  unit: string;
  image: string;
  description: string;
  inStock: boolean;
  weight?: string;
};

type Result =
  | { ok: true; product?: Product }
  | { ok: false; error: string };

function slugify(name: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ы: "y", э: "e", ю: "yu", я: "ya",
  };
  return name
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function validate(input: VendorProductFormInput): string | null {
  if (!input.name.trim()) return "Укажите название товара.";
  if (!input.unit.trim()) return "Укажите единицу измерения (кг, шт, порция…).";
  if (!input.image.trim()) return "Добавьте фотографию товара.";
  if (!input.categoryId.trim()) return "Выберите категорию.";
  if (!Number.isFinite(input.price) || input.price <= 0)
    return "Цена должна быть больше нуля.";
  if (
    input.oldPrice !== undefined &&
    input.oldPrice !== 0 &&
    (!Number.isFinite(input.oldPrice) || input.oldPrice < 0)
  )
    return "Старая цена должна быть неотрицательным числом.";
  return null;
}

export async function vendorCreateProductAction(
  input: VendorProductFormInput
): Promise<Result> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Войдите в кабинет продавца." };

  const err = validate(input);
  if (err) return { ok: false, error: err };

  const slug = slugify(input.name) + "-" + Date.now().toString(36);

  try {
    const source: SourceType = vendor.verticalPrimary === "food" ? "food" : "market";
    const product = await createProduct({
      slug,
      name: input.name.trim(),
      source,
      categoryId: input.categoryId,
      vendorId: vendor.id,
      vertical: vendor.verticalPrimary,
      price: Math.round(input.price),
      oldPrice:
        input.oldPrice != null && input.oldPrice > 0
          ? Math.round(input.oldPrice)
          : undefined,
      unit: input.unit.trim(),
      image: input.image.trim(),
      description: input.description.trim(),
      inStock: input.inStock,
      weight: input.weight?.trim() || undefined,
      isWeekly: false,
    });
    revalidatePath("/vendor/dashboard/catalog");
    revalidatePath("/market");
    revalidatePath("/market/catalog");
    revalidatePath(`/market/section/${source}`);
    revalidatePath(`/market/product/${product.slug}`);
    revalidatePath(`/market/category/${input.categoryId}`);
    return { ok: true, product };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось создать товар",
    };
  }
}

export async function vendorUpdateProductAction(
  id: string,
  input: VendorProductFormInput
): Promise<Result> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Войдите в кабинет продавца." };

  const existing = await getProductById(id);
  if (!existing || existing.vendorId !== vendor.id) {
    return { ok: false, error: "Товар не найден или не принадлежит вам." };
  }

  const err = validate(input);
  if (err) return { ok: false, error: err };

  try {
    const product = await updateProduct(id, {
      name: input.name.trim(),
      categoryId: input.categoryId,
      price: Math.round(input.price),
      oldPrice:
        input.oldPrice != null && input.oldPrice > 0
          ? Math.round(input.oldPrice)
          : undefined,
      unit: input.unit.trim(),
      image: input.image.trim(),
      description: input.description.trim(),
      inStock: input.inStock,
      weight: input.weight?.trim() || undefined,
    });
    if (!product) return { ok: false, error: "Товар не найден" };
    revalidatePath("/vendor/dashboard/catalog");
    revalidatePath("/market");
    revalidatePath("/market/catalog");
    revalidatePath(`/market/product/${product.slug}`);
    return { ok: true, product };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось обновить товар",
    };
  }
}

export async function vendorDeleteProductAction(id: string): Promise<Result> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Войдите в кабинет продавца." };

  const existing = await getProductById(id);
  if (!existing || existing.vendorId !== vendor.id) {
    return { ok: false, error: "Товар не найден или не принадлежит вам." };
  }

  try {
    const ok = await deleteProduct(id);
    if (!ok) return { ok: false, error: "Товар не найден" };
    revalidatePath("/vendor/dashboard/catalog");
    revalidatePath("/market");
    revalidatePath("/market/catalog");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось удалить товар",
    };
  }
}

export async function vendorToggleStockAction(
  id: string,
  inStock: boolean
): Promise<Result> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Войдите в кабинет продавца." };

  const existing = await getProductById(id);
  if (!existing || existing.vendorId !== vendor.id) {
    return { ok: false, error: "Товар не найден или не принадлежит вам." };
  }

  try {
    const product = await updateProduct(id, { inStock });
    if (!product) return { ok: false, error: "Товар не найден" };
    revalidatePath("/vendor/dashboard/catalog");
    revalidatePath("/market");
    revalidatePath("/market/catalog");
    return { ok: true, product };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Ошибка обновления",
    };
  }
}

export async function vendorListProductsAction(): Promise<Product[]> {
  const vendor = await getCurrentVendor();
  if (!vendor) return [];
  return getProductsByVendor(vendor.id);
}
