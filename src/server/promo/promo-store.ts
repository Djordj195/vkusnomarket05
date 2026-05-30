import "server-only";
import type { PromoCode, PromoCodeKind, PromoRedemption } from "@/lib/types";
import {
  getSupabaseAdmin,
  isMissingTableError,
  isSupabaseConfigured,
} from "../supabase";

// Phase 11: dual-mode хранилище промокодов и журнала применений.
// Точно так же, как orders/tickets — Supabase или in-memory globalThis.

type Store = {
  promos: PromoCode[];
  redemptions: PromoRedemption[];
};
const globalKey = "__VKUSNOMARKET_PROMO_STORE__";

function getMemoryStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[globalKey]) g[globalKey] = { promos: [], redemptions: [] };
  return g[globalKey]!;
}

// ── Row mapping ──

type PromoRow = {
  id: string;
  code: string;
  description: string;
  kind: PromoCodeKind;
  value: number;
  min_subtotal: number;
  max_discount: number;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number;
  per_user_limit: number;
  vendor_id: string | null;
  category_id: string | null;
  active: boolean;
  used_count: number;
  total_discount: number;
  created_at: string;
  updated_at: string;
};

function rowToPromo(r: PromoRow): PromoCode {
  return {
    id: r.id,
    code: r.code,
    description: r.description,
    kind: r.kind,
    value: r.value,
    minSubtotal: r.min_subtotal,
    maxDiscount: r.max_discount,
    validFrom: r.valid_from,
    validUntil: r.valid_until,
    usageLimit: r.usage_limit,
    perUserLimit: r.per_user_limit,
    vendorId: r.vendor_id,
    categoryId: r.category_id,
    active: r.active,
    usedCount: r.used_count,
    totalDiscount: r.total_discount,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function promoToRow(p: PromoCode): PromoRow {
  return {
    id: p.id,
    code: p.code,
    description: p.description,
    kind: p.kind,
    value: p.value,
    min_subtotal: p.minSubtotal,
    max_discount: p.maxDiscount,
    valid_from: p.validFrom,
    valid_until: p.validUntil,
    usage_limit: p.usageLimit,
    per_user_limit: p.perUserLimit,
    vendor_id: p.vendorId,
    category_id: p.categoryId,
    active: p.active,
    used_count: p.usedCount,
    total_discount: p.totalDiscount,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

type RedemptionRow = {
  id: string;
  promo_code_id: string;
  promo_code: string;
  order_id: string | null;
  customer_phone: string;
  customer_name: string | null;
  vendor_id: string | null;
  discount_amount: number;
  subtotal: number;
  created_at: string;
};

function rowToRedemption(r: RedemptionRow): PromoRedemption {
  return {
    id: r.id,
    promoCodeId: r.promo_code_id,
    promoCode: r.promo_code,
    orderId: r.order_id,
    customerPhone: r.customer_phone,
    customerName: r.customer_name,
    vendorId: r.vendor_id,
    discountAmount: r.discount_amount,
    subtotal: r.subtotal,
    createdAt: r.created_at,
  };
}

function redemptionToRow(r: PromoRedemption): RedemptionRow {
  return {
    id: r.id,
    promo_code_id: r.promoCodeId,
    promo_code: r.promoCode,
    order_id: r.orderId,
    customer_phone: r.customerPhone,
    customer_name: r.customerName,
    vendor_id: r.vendorId,
    discount_amount: r.discountAmount,
    subtotal: r.subtotal,
    created_at: r.createdAt,
  };
}

// ── Public API ──

export async function listPromos(): Promise<PromoCode[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTableError(error)) return [...getMemoryStore().promos];
      throw new Error(`listPromos failed: ${error.message}`);
    }
    return (data ?? []).map((r) => rowToPromo(r as PromoRow));
  }
  return [...getMemoryStore().promos].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function getPromoById(id: string): Promise<PromoCode | null> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("promo_codes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error))
        return getMemoryStore().promos.find((p) => p.id === id) ?? null;
      throw new Error(`getPromoById failed: ${error.message}`);
    }
    return data ? rowToPromo(data as PromoRow) : null;
  }
  return getMemoryStore().promos.find((p) => p.id === id) ?? null;
}

export async function getPromoByCode(code: string): Promise<PromoCode | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("promo_codes")
      .select("*")
      .eq("code", normalized)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error))
        return (
          getMemoryStore().promos.find((p) => p.code === normalized) ?? null
        );
      throw new Error(`getPromoByCode failed: ${error.message}`);
    }
    return data ? rowToPromo(data as PromoRow) : null;
  }
  return getMemoryStore().promos.find((p) => p.code === normalized) ?? null;
}

export async function savePromo(p: PromoCode): Promise<PromoCode> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb.from("promo_codes").upsert(promoToRow(p));
    if (error && !isMissingTableError(error)) {
      throw new Error(`savePromo failed: ${error.message}`);
    }
  }
  const store = getMemoryStore();
  const idx = store.promos.findIndex((x) => x.id === p.id);
  if (idx >= 0) store.promos[idx] = p;
  else store.promos.unshift(p);
  return p;
}

export async function deletePromo(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb.from("promo_codes").delete().eq("id", id);
    if (error && !isMissingTableError(error)) {
      throw new Error(`deletePromo failed: ${error.message}`);
    }
  }
  const store = getMemoryStore();
  store.promos = store.promos.filter((p) => p.id !== id);
}

export async function appendRedemption(
  r: PromoRedemption
): Promise<PromoRedemption> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb
      .from("promo_redemptions")
      .insert(redemptionToRow(r));
    if (error && !isMissingTableError(error)) {
      throw new Error(`appendRedemption failed: ${error.message}`);
    }
  }
  getMemoryStore().redemptions.unshift(r);
  return r;
}

export async function listRedemptionsForPromo(
  promoCodeId: string
): Promise<PromoRedemption[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("promo_redemptions")
      .select("*")
      .eq("promo_code_id", promoCodeId)
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTableError(error))
        return getMemoryStore().redemptions.filter(
          (r) => r.promoCodeId === promoCodeId
        );
      throw new Error(`listRedemptionsForPromo failed: ${error.message}`);
    }
    return (data ?? []).map((r) => rowToRedemption(r as RedemptionRow));
  }
  return getMemoryStore().redemptions
    .filter((r) => r.promoCodeId === promoCodeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Сколько раз номер `customerPhone` уже применял данный промокод (для проверки
 * лимита `per_user_limit`).
 */
export async function countRedemptionsForUser(
  promoCodeId: string,
  customerPhone: string
): Promise<number> {
  const phone = customerPhone.replace(/\D/g, "");
  if (!phone) return 0;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { count, error } = await sb
      .from("promo_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promo_code_id", promoCodeId)
      .eq("customer_phone", phone);
    if (error) {
      if (isMissingTableError(error))
        return getMemoryStore().redemptions.filter(
          (r) =>
            r.promoCodeId === promoCodeId &&
            r.customerPhone.replace(/\D/g, "") === phone
        ).length;
      throw new Error(`countRedemptionsForUser failed: ${error.message}`);
    }
    return count ?? 0;
  }
  return getMemoryStore().redemptions.filter(
    (r) =>
      r.promoCodeId === promoCodeId &&
      r.customerPhone.replace(/\D/g, "") === phone
  ).length;
}
