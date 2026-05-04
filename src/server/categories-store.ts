import "server-only";
import type { Category, SourceType } from "@/lib/types";
import { CATEGORIES as STATIC_CATEGORIES } from "@/data/categories";
import {
  getSupabaseAdmin,
  isMissingTableError,
  isSupabaseConfigured,
} from "./supabase";

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  source: SourceType;
  icon: string;
  emoji: string;
  items_count: number;
  highlight: boolean;
  sort_order: number;
};

function rowToCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    source: r.source,
    icon: r.icon,
    emoji: r.emoji,
    itemsCount: r.items_count,
    highlight: r.highlight,
  };
}

export async function listCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      // Table missing during initial rollout: fall back to static data.
      if (isMissingTableError(error)) return [...STATIC_CATEGORIES];
      throw new Error(`listCategories: ${error.message}`);
    }
    return (data as CategoryRow[]).map(rowToCategory);
  }
  return [...STATIC_CATEGORIES];
}

export async function getCategoryById(
  id: string
): Promise<Category | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error))
        return STATIC_CATEGORIES.find((c) => c.id === id);
      throw new Error(`getCategoryById: ${error.message}`);
    }
    return data ? rowToCategory(data as CategoryRow) : undefined;
  }
  return STATIC_CATEGORIES.find((c) => c.id === id);
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error))
        return STATIC_CATEGORIES.find((c) => c.slug === slug);
      throw new Error(`getCategoryBySlug: ${error.message}`);
    }
    return data ? rowToCategory(data as CategoryRow) : undefined;
  }
  return STATIC_CATEGORIES.find((c) => c.slug === slug);
}

export async function getCategoriesBySource(
  source: SourceType
): Promise<Category[]> {
  const all = await listCategories();
  return all.filter((c) => c.source === source);
}

// ──────────────────────────────────────────────────────────────────────────
// Admin write API (Supabase-only — fails clearly if DB not configured)
// ──────────────────────────────────────────────────────────────────────────

function categoryToRow(c: Omit<Category, "id"> & { id?: string }) {
  const row: Record<string, unknown> = {
    slug: c.slug,
    name: c.name,
    source: c.source,
    icon: c.icon,
    emoji: c.emoji,
    items_count: c.itemsCount ?? 0,
    highlight: c.highlight ?? false,
  };
  if (c.id) row.id = c.id;
  return row;
}

export async function createCategory(
  input: Omit<Category, "id">
): Promise<Category> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "База данных не подключена. Заполните NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в Vercel и пересоберите проект."
    );
  }
  const sb = getSupabaseAdmin()!;
  const id = `cat-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  const { data: maxRow } = await sb
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder =
    (maxRow as { sort_order?: number } | null)?.sort_order != null
      ? ((maxRow as { sort_order: number }).sort_order ?? 0) + 1
      : 0;

  const row = { ...categoryToRow({ ...input, id }), sort_order: nextOrder };
  const { data, error } = await sb
    .from("categories")
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`createCategory: ${error.message}`);
  return rowToCategory(data as CategoryRow);
}

export async function updateCategory(
  id: string,
  patch: Partial<Omit<Category, "id">>
): Promise<Category | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена. Редактирование недоступно.");
  }
  const sb = getSupabaseAdmin()!;
  const dbPatch: Record<string, unknown> = {};
  if (patch.slug !== undefined) dbPatch.slug = patch.slug;
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.source !== undefined) dbPatch.source = patch.source;
  if (patch.icon !== undefined) dbPatch.icon = patch.icon;
  if (patch.emoji !== undefined) dbPatch.emoji = patch.emoji;
  if (patch.itemsCount !== undefined) dbPatch.items_count = patch.itemsCount;
  if (patch.highlight !== undefined) dbPatch.highlight = patch.highlight;

  const { data, error } = await sb
    .from("categories")
    .update(dbPatch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`updateCategory: ${error.message}`);
  return data ? rowToCategory(data as CategoryRow) : undefined;
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена. Удаление недоступно.");
  }
  const sb = getSupabaseAdmin()!;

  // Guard: refuse to delete a category that still has products.
  const { count: productCount, error: countError } = await sb
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (countError) throw new Error(`deleteCategory: ${countError.message}`);
  if ((productCount ?? 0) > 0) {
    throw new Error(
      `В категории есть товары (${productCount} шт.). Сначала удалите или перенесите их.`
    );
  }

  const { error, count } = await sb
    .from("categories")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(`deleteCategory: ${error.message}`);
  return (count ?? 0) > 0;
}
