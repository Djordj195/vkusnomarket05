import "server-only";

import { getSupabaseAdmin, isSupabaseConfigured, isMissingTableError } from "./supabase";

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  cityId: string | null;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  city_id: string | null;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

function rowToBanner(r: Row): Banner {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    imageUrl: r.image_url,
    linkUrl: r.link_url,
    cityId: r.city_id,
    bgColor: r.bg_color,
    textColor: r.text_color,
    isActive: r.is_active,
    sortOrder: r.sort_order,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    createdAt: r.created_at,
  };
}

const STATIC_BANNERS: Banner[] = [];

export async function listBanners(): Promise<Banner[]> {
  if (!isSupabaseConfigured()) return [...STATIC_BANNERS];
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("banners")
    .select("*")
    .order("sort_order");
  if (error) {
    if (isMissingTableError(error)) return [...STATIC_BANNERS];
    throw new Error(`listBanners: ${error.message}`);
  }
  return (data as Row[]).map(rowToBanner);
}

export async function listActiveBanners(cityId?: string): Promise<Banner[]> {
  const all = await listBanners();
  const now = new Date();
  return all.filter((b) => {
    if (!b.isActive) return false;
    if (b.startsAt && new Date(b.startsAt) > now) return false;
    if (b.endsAt && new Date(b.endsAt) < now) return false;
    if (b.cityId && cityId && b.cityId !== cityId) return false;
    return true;
  });
}

export async function createBanner(
  input: Omit<Banner, "id" | "createdAt">
): Promise<Banner> {
  if (!isSupabaseConfigured()) throw new Error("БД не подключена");
  const sb = getSupabaseAdmin()!;
  const id = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await sb
    .from("banners")
    .insert({
      id,
      title: input.title,
      subtitle: input.subtitle,
      image_url: input.imageUrl,
      link_url: input.linkUrl,
      city_id: input.cityId,
      bg_color: input.bgColor,
      text_color: input.textColor,
      is_active: input.isActive,
      sort_order: input.sortOrder,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
    })
    .select()
    .single();
  if (error) throw new Error(`createBanner: ${error.message}`);
  return rowToBanner(data as Row);
}

export async function updateBanner(
  id: string,
  input: Partial<Omit<Banner, "id" | "createdAt">>
): Promise<Banner | null> {
  if (!isSupabaseConfigured()) throw new Error("БД не подключена");
  const sb = getSupabaseAdmin()!;
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.subtitle !== undefined) row.subtitle = input.subtitle;
  if (input.imageUrl !== undefined) row.image_url = input.imageUrl;
  if (input.linkUrl !== undefined) row.link_url = input.linkUrl;
  if (input.cityId !== undefined) row.city_id = input.cityId;
  if (input.bgColor !== undefined) row.bg_color = input.bgColor;
  if (input.textColor !== undefined) row.text_color = input.textColor;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.startsAt !== undefined) row.starts_at = input.startsAt;
  if (input.endsAt !== undefined) row.ends_at = input.endsAt;

  const { data, error } = await sb
    .from("banners")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`updateBanner: ${error.message}`);
  return data ? rowToBanner(data as Row) : null;
}

export async function deleteBanner(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error("БД не подключена");
  const sb = getSupabaseAdmin()!;
  const { error } = await sb.from("banners").delete().eq("id", id);
  if (error) throw new Error(`deleteBanner: ${error.message}`);
  return true;
}
