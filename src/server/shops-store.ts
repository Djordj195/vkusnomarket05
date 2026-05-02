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
