import "server-only";
import type { Shop, SourceType } from "@/lib/types";
import { SHOPS as STATIC_SHOPS } from "@/data/shops";
import {
  getSupabaseAdmin,
  isMissingTableError,
  isSupabaseConfigured,
} from "./supabase";

type ShopRow = {
  id: string;
  slug: string;
  name: string;
  source: SourceType;
  description: string | null;
  cover: string | null;
  rating: number | null;
  is_open: boolean;
};

function rowToShop(r: ShopRow): Shop {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    source: r.source,
    description: r.description ?? undefined,
    cover: r.cover ?? undefined,
    rating: r.rating ?? undefined,
    isOpen: r.is_open,
  };
}

export async function listShops(): Promise<Shop[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("shops")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      if (isMissingTableError(error)) return [...STATIC_SHOPS];
      throw new Error(`listShops: ${error.message}`);
    }
    return (data as ShopRow[]).map(rowToShop);
  }
  return [...STATIC_SHOPS];
}

export async function getShopsBySource(source: SourceType): Promise<Shop[]> {
  const all = await listShops();
  return all.filter((s) => s.source === source);
}

export async function getShopById(id: string): Promise<Shop | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("shops")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error))
        return STATIC_SHOPS.find((s) => s.id === id);
      throw new Error(`getShopById: ${error.message}`);
    }
    return data ? rowToShop(data as ShopRow) : undefined;
  }
  return STATIC_SHOPS.find((s) => s.id === id);
}

export async function getShopBySlug(slug: string): Promise<Shop | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("shops")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error))
        return STATIC_SHOPS.find((s) => s.slug === slug);
      throw new Error(`getShopBySlug: ${error.message}`);
    }
    return data ? rowToShop(data as ShopRow) : undefined;
  }
  return STATIC_SHOPS.find((s) => s.slug === slug);
}

// ──────────────────────────────────────────────────────────────────────────
// Admin write API (Supabase-only — fails clearly if DB not configured)
// ──────────────────────────────────────────────────────────────────────────

function shopToRow(s: Omit<Shop, "id"> & { id?: string }) {
  const row: Record<string, unknown> = {
    slug: s.slug,
    name: s.name,
    source: s.source,
    description: s.description ?? null,
    cover: s.cover ?? null,
    rating: s.rating ?? null,
    is_open: s.isOpen ?? true,
  };
  if (s.id) row.id = s.id;
  return row;
}

export async function createShop(input: Omit<Shop, "id">): Promise<Shop> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "База данных не подключена. Заполните NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в Vercel и пересоберите проект."
    );
  }
  const sb = getSupabaseAdmin()!;
  const id = `shop-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const { data, error } = await sb
    .from("shops")
    .insert(shopToRow({ ...input, id }))
    .select()
    .single();
  if (error) throw new Error(`createShop: ${error.message}`);
  return rowToShop(data as ShopRow);
}

export async function updateShop(
  id: string,
  patch: Partial<Omit<Shop, "id">>
): Promise<Shop | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена. Редактирование недоступно.");
  }
  const sb = getSupabaseAdmin()!;
  const dbPatch: Record<string, unknown> = {};
  if (patch.slug !== undefined) dbPatch.slug = patch.slug;
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.source !== undefined) dbPatch.source = patch.source;
  if (patch.description !== undefined)
    dbPatch.description = patch.description ?? null;
  if (patch.cover !== undefined) dbPatch.cover = patch.cover ?? null;
  if (patch.rating !== undefined) dbPatch.rating = patch.rating ?? null;
  if (patch.isOpen !== undefined) dbPatch.is_open = patch.isOpen;

  const { data, error } = await sb
    .from("shops")
    .update(dbPatch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`updateShop: ${error.message}`);
  return data ? rowToShop(data as ShopRow) : undefined;
}

export async function deleteShop(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена. Удаление недоступно.");
  }
  const sb = getSupabaseAdmin()!;
  // The FK in `products.shop_id` is `on delete set null`, so deleting a shop
  // simply detaches its products — no extra guard needed.
  const { error, count } = await sb
    .from("shops")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(`deleteShop: ${error.message}`);
  return (count ?? 0) > 0;
}
