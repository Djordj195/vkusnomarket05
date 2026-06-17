import "server-only";
import type { Product, SourceType, Vertical } from "@/lib/types";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { DEFAULT_VENDOR_ID } from "@/data/vendors";
import {
  getSupabaseAdmin,
  isMissingTableError,
  isSupabaseConfigured,
} from "./supabase";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  source: SourceType;
  category_id: string;
  shop_id: string | null;
  vendor_id: string | null;
  vertical: Vertical | null;
  price: number;
  old_price: number | null;
  unit: string;
  image: string;
  description: string;
  in_stock: boolean;
  weight: string | null;
  is_weekly: boolean;
  sort_order: number;
};

function defaultVerticalForSource(s: SourceType): Vertical {
  return s === "food" ? "food" : "grocery";
}

function rowToProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    source: r.source,
    categoryId: r.category_id,
    shopId: r.shop_id ?? undefined,
    vendorId: r.vendor_id ?? DEFAULT_VENDOR_ID,
    vertical: r.vertical ?? defaultVerticalForSource(r.source),
    price: r.price,
    oldPrice: r.old_price ?? undefined,
    unit: r.unit,
    image: r.image,
    description: r.description,
    inStock: r.in_stock,
    weight: r.weight ?? undefined,
    isWeekly: r.is_weekly,
  };
}

function staticProductsHydrated(): Product[] {
  return STATIC_PRODUCTS.map((p) => ({
    ...p,
    vendorId: p.vendorId ?? DEFAULT_VENDOR_ID,
    vertical: p.vertical ?? defaultVerticalForSource(p.source),
  }));
}

function productToRow(
  p: Omit<Product, "id"> & { id?: string },
  sortOrder?: number
) {
  const row: Record<string, unknown> = {
    slug: p.slug,
    name: p.name,
    source: p.source,
    category_id: p.categoryId,
    shop_id: p.shopId ?? null,
    vendor_id: p.vendorId ?? null,
    vertical: p.vertical ?? null,
    price: p.price,
    old_price: p.oldPrice ?? null,
    unit: p.unit,
    image: p.image,
    description: p.description ?? "",
    in_stock: p.inStock,
    weight: p.weight ?? null,
    is_weekly: p.isWeekly ?? false,
  };
  if (p.id) row.id = p.id;
  if (sortOrder != null) row.sort_order = sortOrder;
  return row;
}

export async function listProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTableError(error)) return staticProductsHydrated();
      throw new Error(`listProducts: ${error.message}`);
    }
    return (data as ProductRow[]).map(rowToProduct);
  }
  return staticProductsHydrated();
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error))
        return staticProductsHydrated().find((p) => p.id === id);
      throw new Error(`getProductById: ${error.message}`);
    }
    return data ? rowToProduct(data as ProductRow) : undefined;
  }
  return staticProductsHydrated().find((p) => p.id === id);
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error))
        return staticProductsHydrated().find((p) => p.slug === slug);
      throw new Error(`getProductBySlug: ${error.message}`);
    }
    return data ? rowToProduct(data as ProductRow) : undefined;
  }
  return staticProductsHydrated().find((p) => p.slug === slug);
}

export async function getProductsByCategory(
  categoryId: string
): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTableError(error))
        return staticProductsHydrated().filter(
          (p) => p.categoryId === categoryId
        );
      throw new Error(`getProductsByCategory: ${error.message}`);
    }
    return (data as ProductRow[]).map(rowToProduct);
  }
  return staticProductsHydrated().filter(
    (p) => p.categoryId === categoryId
  );
}

export async function getProductsByShop(shopId: string): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("shop_id", shopId)
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTableError(error))
        return staticProductsHydrated().filter((p) => p.shopId === shopId);
      throw new Error(`getProductsByShop: ${error.message}`);
    }
    return (data as ProductRow[]).map(rowToProduct);
  }
  return staticProductsHydrated().filter((p) => p.shopId === shopId);
}

export async function getProductsBySource(
  source: SourceType
): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("source", source)
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTableError(error))
        return staticProductsHydrated().filter((p) => p.source === source);
      throw new Error(`getProductsBySource: ${error.message}`);
    }
    return (data as ProductRow[]).map(rowToProduct);
  }
  return staticProductsHydrated().filter((p) => p.source === source);
}

export async function getProductsByVendor(
  vendorId: string
): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTableError(error))
        return staticProductsHydrated().filter((p) => p.vendorId === vendorId);
      throw new Error(`getProductsByVendor: ${error.message}`);
    }
    return (data as ProductRow[]).map(rowToProduct);
  }
  return staticProductsHydrated().filter((p) => p.vendorId === vendorId);
}

export async function getProductsByVertical(
  vertical: Vertical
): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("vertical", vertical)
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTableError(error))
        return staticProductsHydrated().filter((p) => p.vertical === vertical);
      throw new Error(`getProductsByVertical: ${error.message}`);
    }
    return (data as ProductRow[]).map(rowToProduct);
  }
  return staticProductsHydrated().filter((p) => p.vertical === vertical);
}

export async function getWeeklyProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("is_weekly", true)
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTableError(error))
        return staticProductsHydrated().filter((p) => p.isWeekly);
      throw new Error(`getWeeklyProducts: ${error.message}`);
    }
    return (data as ProductRow[]).map(rowToProduct);
  }
  return staticProductsHydrated().filter((p) => p.isWeekly);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const pattern = `%${q}%`;
    const { data, error } = await sb
      .from("products")
      .select("*")
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .order("sort_order", { ascending: true })
      .limit(50);
    if (error) {
      if (isMissingTableError(error)) {
        return staticProductsHydrated().filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
      }
      throw new Error(`searchProducts: ${error.message}`);
    }
    return (data as ProductRow[]).map(rowToProduct);
  }
  return staticProductsHydrated().filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Admin write API (Supabase-only — fails clearly if DB not configured)
// ──────────────────────────────────────────────────────────────────────────

export async function createProduct(
  input: Omit<Product, "id">
): Promise<Product> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "База данных не подключена. Заполните NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в Vercel и пересоберите проект."
    );
  }
  const sb = getSupabaseAdmin()!;
  const id = `p-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  // Determine the next sort order so new products end up at the bottom
  const { data: maxRow } = await sb
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder =
    (maxRow as { sort_order?: number } | null)?.sort_order != null
      ? ((maxRow as { sort_order: number }).sort_order ?? 0) + 1
      : 0;

  const { data, error } = await sb
    .from("products")
    .insert(productToRow({ ...input, id }, nextOrder))
    .select()
    .single();
  if (error) throw new Error(`createProduct: ${error.message}`);
  return rowToProduct(data as ProductRow);
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, "id">>
): Promise<Product | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена. Редактирование недоступно.");
  }
  const sb = getSupabaseAdmin()!;
  const dbPatch: Record<string, unknown> = {};
  if (patch.slug !== undefined) dbPatch.slug = patch.slug;
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.source !== undefined) dbPatch.source = patch.source;
  if (patch.categoryId !== undefined) dbPatch.category_id = patch.categoryId;
  if (patch.shopId !== undefined) dbPatch.shop_id = patch.shopId ?? null;
  if (patch.price !== undefined) dbPatch.price = patch.price;
  if (patch.oldPrice !== undefined) dbPatch.old_price = patch.oldPrice ?? null;
  if (patch.unit !== undefined) dbPatch.unit = patch.unit;
  if (patch.image !== undefined) dbPatch.image = patch.image;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.inStock !== undefined) dbPatch.in_stock = patch.inStock;
  if (patch.weight !== undefined) dbPatch.weight = patch.weight ?? null;
  if (patch.isWeekly !== undefined) dbPatch.is_weekly = patch.isWeekly;
  if (patch.vendorId !== undefined) dbPatch.vendor_id = patch.vendorId ?? null;
  if (patch.vertical !== undefined) dbPatch.vertical = patch.vertical ?? null;

  const { data, error } = await sb
    .from("products")
    .update(dbPatch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`updateProduct: ${error.message}`);
  return data ? rowToProduct(data as ProductRow) : undefined;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена. Удаление недоступно.");
  }
  const sb = getSupabaseAdmin()!;
  const { error, count } = await sb
    .from("products")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(`deleteProduct: ${error.message}`);
  return (count ?? 0) > 0;
}
