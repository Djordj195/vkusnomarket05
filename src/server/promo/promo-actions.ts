"use server";

import { revalidatePath } from "next/cache";
import type { PromoCode, PromoCodeKind, PromoValidation } from "@/lib/types";
import { isAdminAuthenticated } from "../admin-auth";
import { logAudit } from "../audit-store";
import { DELIVERY_FEE } from "@/lib/constants";
import {
  deletePromo as deletePromoFromStore,
  getPromoById,
  getPromoByCode,
  listPromos,
  listRedemptionsForPromo,
  savePromo,
} from "./promo-store";
import { validatePromoCode } from "./validate";

async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Доступ запрещён");
  }
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

// ── Public action: проверить промокод в корзине ──

export async function validatePromoCodeAction(input: {
  code: string;
  customerPhone: string | null;
  items: Array<{ productId: string; quantity: number }>;
  deliveryKind: "delivery" | "pickup";
}): Promise<PromoValidation> {
  if (!input.code.trim()) {
    return { ok: false, error: "Введите промокод." };
  }
  return validatePromoCode({
    code: input.code,
    customerPhone: input.customerPhone,
    items: input.items,
    deliveryFee: DELIVERY_FEE,
    deliveryKind: input.deliveryKind,
  });
}

// ── Admin actions ──

export type SavePromoInput = {
  id?: string;
  code: string;
  description: string;
  kind: PromoCodeKind;
  value: number;
  minSubtotal: number;
  maxDiscount: number;
  validFrom: string | null;
  validUntil: string | null;
  usageLimit: number;
  perUserLimit: number;
  vendorId: string | null;
  categoryId: string | null;
  active: boolean;
};

function validateSaveInput(
  input: SavePromoInput
): { ok: true } | { ok: false; error: string } {
  const code = normalizeCode(input.code);
  if (!code) return { ok: false, error: "Укажите код." };
  if (code.length < 3 || code.length > 32)
    return { ok: false, error: "Код от 3 до 32 символов." };
  if (!/^[A-Z0-9_-]+$/.test(code))
    return { ok: false, error: "Код может содержать A-Z, 0-9, _ и -." };
  if (input.kind === "percent") {
    if (input.value < 1 || input.value > 100)
      return { ok: false, error: "Процент должен быть 1..100." };
  }
  if (input.kind === "fixed") {
    if (input.value <= 0) return { ok: false, error: "Сумма должна быть > 0." };
  }
  if (input.minSubtotal < 0)
    return { ok: false, error: "Мин. сумма не может быть отрицательной." };
  if (input.maxDiscount < 0)
    return { ok: false, error: "Лимит скидки не может быть отрицательным." };
  if (input.usageLimit < 0)
    return { ok: false, error: "Лимит использований не может быть отрицательным." };
  if (input.perUserLimit < 0)
    return { ok: false, error: "Лимит на клиента не может быть отрицательным." };
  if (input.validFrom && input.validUntil) {
    if (new Date(input.validFrom).getTime() >= new Date(input.validUntil).getTime()) {
      return { ok: false, error: "Дата начала должна быть раньше окончания." };
    }
  }
  return { ok: true };
}

export async function createPromoAction(
  input: SavePromoInput
): Promise<{ ok: true; promo: PromoCode } | { ok: false; error: string }> {
  await requireAdmin();
  const check = validateSaveInput(input);
  if (!check.ok) return check;

  const code = normalizeCode(input.code);
  const existing = await getPromoByCode(code);
  if (existing) return { ok: false, error: "Такой код уже существует." };

  const now = new Date().toISOString();
  const promo: PromoCode = {
    id: newId("promo"),
    code,
    description: input.description.trim(),
    kind: input.kind,
    value: input.kind === "free_shipping" ? 0 : Math.round(input.value),
    minSubtotal: Math.round(input.minSubtotal),
    maxDiscount: Math.round(input.maxDiscount),
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    usageLimit: Math.round(input.usageLimit),
    perUserLimit: Math.round(input.perUserLimit),
    vendorId: input.vendorId,
    categoryId: input.categoryId,
    active: input.active,
    usedCount: 0,
    totalDiscount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await savePromo(promo);

  await logAudit({
    actorType: "admin",
    action: "promo.created",
    targetType: "promo",
    targetId: promo.id,
    payload: {
      code: promo.code,
      kind: promo.kind,
      value: promo.value,
    },
  });

  revalidatePath("/admin/promo");
  return { ok: true, promo };
}

export async function updatePromoAction(
  input: SavePromoInput
): Promise<{ ok: true; promo: PromoCode } | { ok: false; error: string }> {
  await requireAdmin();
  if (!input.id) return { ok: false, error: "Не указан id." };
  const existing = await getPromoById(input.id);
  if (!existing) return { ok: false, error: "Промокод не найден." };
  const check = validateSaveInput(input);
  if (!check.ok) return check;

  const code = normalizeCode(input.code);
  if (code !== existing.code) {
    const dup = await getPromoByCode(code);
    if (dup && dup.id !== existing.id) {
      return { ok: false, error: "Такой код уже существует." };
    }
  }

  const updated: PromoCode = {
    ...existing,
    code,
    description: input.description.trim(),
    kind: input.kind,
    value: input.kind === "free_shipping" ? 0 : Math.round(input.value),
    minSubtotal: Math.round(input.minSubtotal),
    maxDiscount: Math.round(input.maxDiscount),
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    usageLimit: Math.round(input.usageLimit),
    perUserLimit: Math.round(input.perUserLimit),
    vendorId: input.vendorId,
    categoryId: input.categoryId,
    active: input.active,
    updatedAt: new Date().toISOString(),
  };
  await savePromo(updated);

  await logAudit({
    actorType: "admin",
    action: "promo.updated",
    targetType: "promo",
    targetId: updated.id,
    payload: { code: updated.code, active: updated.active },
  });

  revalidatePath("/admin/promo");
  revalidatePath(`/admin/promo/${updated.id}`);
  return { ok: true, promo: updated };
}

export async function deletePromoAction(input: {
  id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const existing = await getPromoById(input.id);
  if (!existing) return { ok: false, error: "Промокод не найден." };
  await deletePromoFromStore(input.id);

  await logAudit({
    actorType: "admin",
    action: "promo.deleted",
    targetType: "promo",
    targetId: input.id,
    payload: { code: existing.code },
  });

  revalidatePath("/admin/promo");
  return { ok: true };
}

export async function togglePromoAction(input: {
  id: string;
  active: boolean;
}): Promise<{ ok: true; promo: PromoCode } | { ok: false; error: string }> {
  await requireAdmin();
  const existing = await getPromoById(input.id);
  if (!existing) return { ok: false, error: "Промокод не найден." };
  const updated: PromoCode = {
    ...existing,
    active: input.active,
    updatedAt: new Date().toISOString(),
  };
  await savePromo(updated);

  await logAudit({
    actorType: "admin",
    action: "promo.updated",
    targetType: "promo",
    targetId: updated.id,
    payload: { code: updated.code, active: updated.active },
  });

  revalidatePath("/admin/promo");
  revalidatePath(`/admin/promo/${updated.id}`);
  return { ok: true, promo: updated };
}

export async function listPromosAction(): Promise<PromoCode[]> {
  await requireAdmin();
  return listPromos();
}

export async function listPromoRedemptionsAction(
  promoId: string
): Promise<{ ok: true; redemptions: Awaited<ReturnType<typeof listRedemptionsForPromo>> } | { ok: false; error: string }> {
  await requireAdmin();
  const promo = await getPromoById(promoId);
  if (!promo) return { ok: false, error: "Промокод не найден." };
  const redemptions = await listRedemptionsForPromo(promoId);
  return { ok: true, redemptions };
}
