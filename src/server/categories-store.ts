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
