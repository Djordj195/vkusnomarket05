import "server-only";
import type {
  LegalEntityType,
  Vendor,
  VendorStatus,
  Vertical,
} from "@/lib/types";
import { VENDORS as STATIC_VENDORS, DEFAULT_VENDOR_ID } from "@/data/vendors";
import {
  getSupabaseAdmin,
  isMissingTableError,
  isSupabaseConfigured,
} from "./supabase";

export { DEFAULT_VENDOR_ID };

type VendorRow = {
  id: string;
  slug: string;
  brand_name: string;
  vertical_primary: Vertical;
  verticals: Vertical[] | null;
  city_id: string;
  owner_user_id: string | null;
  status: VendorStatus;
  logo_url: string | null;
  banner_url: string | null;
  short_description: string | null;
  description: string | null;
  legal_entity_type: LegalEntityType | null;
  legal_name: string | null;
  inn: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_telegram: string | null;
  contact_whatsapp: string | null;
  rating_avg: number;
  rating_count: number;
  featured: boolean;
  subscription_tier: "free" | "basic" | "premium";
  sort_order: number;
};

function rowToVendor(r: VendorRow): Vendor {
  return {
    id: r.id,
    slug: r.slug,
    brandName: r.brand_name,
    verticalPrimary: r.vertical_primary,
    verticals: Array.isArray(r.verticals) ? r.verticals : [r.vertical_primary],
    cityId: r.city_id,
    ownerUserId: r.owner_user_id ?? undefined,
    status: r.status,
    logoUrl: r.logo_url ?? undefined,
    bannerUrl: r.banner_url ?? undefined,
    shortDescription: r.short_description ?? undefined,
    description: r.description ?? undefined,
    legalEntityType: r.legal_entity_type ?? undefined,
    legalName: r.legal_name ?? undefined,
    inn: r.inn ?? undefined,
    contacts: {
      phone: r.contact_phone ?? undefined,
      email: r.contact_email ?? undefined,
      telegram: r.contact_telegram ?? undefined,
      whatsapp: r.contact_whatsapp ?? undefined,
    },
    ratingAvg: r.rating_avg,
    ratingCount: r.rating_count,
    featured: r.featured,
    subscriptionTier: r.subscription_tier,
    sortOrder: r.sort_order,
  };
}

const VENDOR_COLS =
  "id, slug, brand_name, vertical_primary, verticals, city_id, owner_user_id, status, logo_url, banner_url, short_description, description, legal_entity_type, legal_name, inn, contact_phone, contact_email, contact_telegram, contact_whatsapp, rating_avg, rating_count, featured, subscription_tier, sort_order";

export type ListVendorsOptions = {
  cityId?: string;
  vertical?: Vertical;
  status?: VendorStatus | VendorStatus[];
  featuredOnly?: boolean;
};

export async function listVendors(
  options: ListVendorsOptions = {}
): Promise<Vendor[]> {
  const { cityId, vertical, status, featuredOnly } = options;

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    let q = sb.from("vendors").select(VENDOR_COLS);
    q = q.is("deleted_at", null);
    if (cityId) q = q.eq("city_id", cityId);
    if (vertical) q = q.eq("vertical_primary", vertical);
    if (Array.isArray(status)) q = q.in("status", status);
    else if (status) q = q.eq("status", status);
    if (featuredOnly) q = q.eq("featured", true);
    const { data, error } = await q.order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTableError(error)) return filterStatic(options);
      throw new Error(`listVendors: ${error.message}`);
    }
    return (data as VendorRow[]).map(rowToVendor);
  }
  return filterStatic(options);
}

function filterStatic(opts: ListVendorsOptions): Vendor[] {
  return STATIC_VENDORS.filter((v) => {
    if (opts.cityId && v.cityId !== opts.cityId) return false;
    if (opts.vertical && v.verticalPrimary !== opts.vertical) return false;
    if (opts.status) {
      const allowed = Array.isArray(opts.status) ? opts.status : [opts.status];
      if (!allowed.includes(v.status)) return false;
    }
    if (opts.featuredOnly && !v.featured) return false;
    return true;
  });
}

export async function getVendorById(id: string): Promise<Vendor | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("vendors")
      .select(VENDOR_COLS)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error))
        return STATIC_VENDORS.find((v) => v.id === id);
      throw new Error(`getVendorById: ${error.message}`);
    }
    return data ? rowToVendor(data as VendorRow) : undefined;
  }
  return STATIC_VENDORS.find((v) => v.id === id);
}

export async function getVendorBySlug(
  slug: string
): Promise<Vendor | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("vendors")
      .select(VENDOR_COLS)
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error))
        return STATIC_VENDORS.find((v) => v.slug === slug);
      throw new Error(`getVendorBySlug: ${error.message}`);
    }
    return data ? rowToVendor(data as VendorRow) : undefined;
  }
  return STATIC_VENDORS.find((v) => v.slug === slug);
}

export async function getVendorByContactPhone(
  phone: string
): Promise<Vendor | undefined> {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    // Try all possible stored formats: digits-only, +7..., 8..., formatted
    const variants = new Set([
      normalized,
      phone,
      `+7${normalized.slice(1)}`,
      `8${normalized.slice(1)}`,
    ]);
    for (const variant of variants) {
      const { data, error } = await sb
        .from("vendors")
        .select(VENDOR_COLS)
        .eq("contact_phone", variant)
        .maybeSingle();
      if (error && !isMissingTableError(error)) continue;
      if (data) return rowToVendor(data as VendorRow);
    }
    // Fallback: search by digits suffix using ilike
    const last10 = normalized.slice(-10);
    if (last10.length === 10) {
      const { data, error } = await sb
        .from("vendors")
        .select(VENDOR_COLS)
        .ilike("contact_phone", `%${last10.slice(0, 3)}%${last10.slice(3, 6)}%${last10.slice(6)}`)
        .limit(1)
        .maybeSingle();
      if (!error && data) return rowToVendor(data as VendorRow);
    }
    return undefined;
  }

  return STATIC_VENDORS.find((v) => {
    const cp = v.contacts?.phone?.replace(/\D/g, "") ?? "";
    const cn = cp.startsWith("8") ? `7${cp.slice(1)}` : cp;
    return cn === normalized;
  });
}

export type CreateVendorInput = {
  id: string;
  slug: string;
  brandName: string;
  verticalPrimary: Vertical;
  verticals: Vertical[];
  cityId: string;
  shortDescription?: string;
  description?: string;
  legalEntityType?: LegalEntityType;
  legalName?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  legalAddress?: string;
  licenseNumber?: string;
  licenseExpiresAt?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactTelegram?: string;
  contactWhatsapp?: string;
};

export async function createVendorApplication(
  input: CreateVendorInput
): Promise<Vendor> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "createVendorApplication: Supabase не настроен. Применить миграцию 0005."
    );
  }
  const sb = getSupabaseAdmin()!;
  const row = {
    id: input.id,
    slug: input.slug,
    brand_name: input.brandName,
    vertical_primary: input.verticalPrimary,
    verticals: input.verticals,
    city_id: input.cityId,
    status: "pending" as VendorStatus,
    short_description: input.shortDescription ?? null,
    description: input.description ?? null,
    legal_entity_type: input.legalEntityType ?? null,
    legal_name: input.legalName ?? null,
    inn: input.inn ?? null,
    kpp: input.kpp ?? null,
    ogrn: input.ogrn ?? null,
    legal_address: input.legalAddress ?? null,
    license_number: input.licenseNumber ?? null,
    license_expires_at: input.licenseExpiresAt ?? null,
    contact_phone: input.contactPhone ? input.contactPhone.replace(/\D/g, "") : null,
    contact_email: input.contactEmail ?? null,
    contact_telegram: input.contactTelegram ?? null,
    contact_whatsapp: input.contactWhatsapp ?? null,
    rating_avg: 0,
    rating_count: 0,
    featured: false,
    subscription_tier: "free",
    sort_order: 999,
  };
  const { data, error } = await sb
    .from("vendors")
    .insert(row)
    .select(VENDOR_COLS)
    .single();
  if (error) {
    throw new Error(`createVendorApplication: ${error.message}`);
  }
  return rowToVendor(data as VendorRow);
}

export async function updateVendorStatus(
  id: string,
  status: VendorStatus
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("updateVendorStatus: Supabase не настроен.");
  }
  const sb = getSupabaseAdmin()!;
  const { error } = await sb
    .from("vendors")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(`updateVendorStatus: ${error.message}`);
}

export async function updateVendorFeatured(
  id: string,
  featured: boolean
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("updateVendorFeatured: Supabase не настроен.");
  }
  const sb = getSupabaseAdmin()!;
  const { error } = await sb
    .from("vendors")
    .update({ featured })
    .eq("id", id);
  if (error) throw new Error(`updateVendorFeatured: ${error.message}`);
}

export type VendorStorefrontPatch = {
  logoUrl?: string | null;
  bannerUrl?: string | null;
  brandName?: string;
  shortDescription?: string | null;
  description?: string | null;
};

/**
 * Partial update for fields the vendor can edit themselves in their dashboard
 * (logo / banner / short bio / full description / brand name). Only sent
 * fields are written. Pass `null` to clear a string column.
 */
export async function updateVendorStorefront(
  id: string,
  patch: VendorStorefrontPatch
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("updateVendorStorefront: Supabase не настроен.");
  }
  const row: Record<string, string | null> = {};
  if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl;
  if (patch.bannerUrl !== undefined) row.banner_url = patch.bannerUrl;
  if (patch.brandName !== undefined) row.brand_name = patch.brandName;
  if (patch.shortDescription !== undefined)
    row.short_description = patch.shortDescription;
  if (patch.description !== undefined) row.description = patch.description;
  if (Object.keys(row).length === 0) return;
  const sb = getSupabaseAdmin()!;
  const { error } = await sb.from("vendors").update(row).eq("id", id);
  if (error) throw new Error(`updateVendorStorefront: ${error.message}`);
}

export type VendorContactsPatch = {
  phone?: string;
  email?: string;
  telegram?: string;
  whatsapp?: string;
  legalEntityType?: string;
  legalName?: string;
  inn?: string;
};

export async function updateVendorContacts(
  id: string,
  patch: VendorContactsPatch
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("updateVendorContacts: Supabase не настроен.");
  }
  const row: Record<string, unknown> = {};
  if (patch.phone !== undefined) row.contact_phone = patch.phone.replace(/\D/g, "") || null;
  if (patch.email !== undefined) row.contact_email = patch.email || null;
  if (patch.telegram !== undefined) row.contact_telegram = patch.telegram || null;
  if (patch.whatsapp !== undefined) row.contact_whatsapp = patch.whatsapp || null;
  if (patch.legalEntityType !== undefined) row.legal_entity_type = patch.legalEntityType;
  if (patch.legalName !== undefined) row.legal_name = patch.legalName;
  if (patch.inn !== undefined) row.inn = patch.inn;
  if (Object.keys(row).length === 0) return;
  const sb = getSupabaseAdmin()!;
  const { error } = await sb.from("vendors").update(row).eq("id", id);
  if (error) throw new Error(`updateVendorContacts: ${error.message}`);
}

export async function softDeleteVendor(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("softDeleteVendor: Supabase не настроен.");
  }
  const sb = getSupabaseAdmin()!;
  const now = new Date().toISOString();

  // Mark vendor as deleted
  const { error } = await sb
    .from("vendors")
    .update({ deleted_at: now, status: "blocked" as VendorStatus })
    .eq("id", id);
  if (error) throw new Error(`softDeleteVendor: ${error.message}`);

  // Hide vendor's products from buyers
  const { error: prodErr } = await sb
    .from("products")
    .update({ vendor_deleted: true })
    .eq("vendor_id", id);
  if (prodErr) {
    console.error(`softDeleteVendor: failed to hide products: ${prodErr.message}`);
  }
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return !STATIC_VENDORS.some((v) => v.slug === slug);
  }
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("vendors")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error))
      return !STATIC_VENDORS.some((v) => v.slug === slug);
    throw new Error(`isSlugAvailable: ${error.message}`);
  }
  return !data;
}
