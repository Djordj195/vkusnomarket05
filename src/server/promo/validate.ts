import "server-only";
import type {
  PromoDiscountBreakdown,
  PromoValidation,
} from "@/lib/types";
import {
  countRedemptionsForUser,
  getPromoByCode,
} from "./promo-store";
import { getProductById } from "../products-store";

export type ValidatePromoInput = {
  code: string;
  customerPhone: string | null;
  items: Array<{ productId: string; quantity: number }>;
  /** Сколько групп по vendor'ам — для распределения скидки. Не используется напрямую, считается из items. */
  deliveryFee: number; // на группу
  deliveryKind: "delivery" | "pickup";
};

type ResolvedItem = {
  productId: string;
  vendorKey: string;
  categoryId: string | null;
  price: number;
  quantity: number;
};

export async function validatePromoCode(
  input: ValidatePromoInput
): Promise<PromoValidation> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Введите промокод." };

  const promo = await getPromoByCode(code);
  if (!promo) return { ok: false, error: "Промокод не найден." };
  if (!promo.active) return { ok: false, error: "Промокод деактивирован." };

  const now = Date.now();
  if (promo.validFrom && new Date(promo.validFrom).getTime() > now) {
    return { ok: false, error: "Промокод ещё не начал действовать." };
  }
  if (promo.validUntil && new Date(promo.validUntil).getTime() < now) {
    return { ok: false, error: "Срок действия промокода истёк." };
  }
  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
    return { ok: false, error: "Промокод исчерпан." };
  }

  if (promo.perUserLimit > 0 && input.customerPhone) {
    const used = await countRedemptionsForUser(promo.id, input.customerPhone);
    if (used >= promo.perUserLimit) {
      return { ok: false, error: "Вы уже использовали этот промокод." };
    }
  }

  // Резолвим позиции корзины.
  const resolved: ResolvedItem[] = [];
  for (const it of input.items) {
    if (it.quantity <= 0) continue;
    const p = await getProductById(it.productId);
    if (!p) continue;
    resolved.push({
      productId: p.id,
      vendorKey: p.vendorId ?? "__unknown__",
      categoryId: p.categoryId ?? null,
      price: p.price,
      quantity: it.quantity,
    });
  }
  if (resolved.length === 0) {
    return { ok: false, error: "Корзина пуста." };
  }

  // Группируем по vendor'у, считаем подытоги.
  const groups = new Map<string, ResolvedItem[]>();
  for (const it of resolved) {
    const arr = groups.get(it.vendorKey) ?? [];
    arr.push(it);
    groups.set(it.vendorKey, arr);
  }

  // Какие группы попадают под действие промокода?
  // - Если promo.vendorId задан — только эта группа.
  // - Если promo.categoryId задан — позиции с этой категорией (несмотря на vendor),
  //   но скидка рассчитывается на сумму этих позиций внутри каждой группы.
  // - Иначе — все группы.

  const eligibleGroups: Array<{
    vendorKey: string;
    items: ResolvedItem[];
    /** Сумма позиций в группе, на которые распространяется промокод. */
    eligibleSubtotal: number;
    /** Полный подытог группы (для отображения). */
    subtotal: number;
  }> = [];

  for (const [vendorKey, items] of groups.entries()) {
    if (promo.vendorId && promo.vendorId !== vendorKey) continue;
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    let eligibleSubtotal = subtotal;
    if (promo.categoryId) {
      eligibleSubtotal = items
        .filter((i) => i.categoryId === promo.categoryId)
        .reduce((s, i) => s + i.price * i.quantity, 0);
    }
    if (eligibleSubtotal <= 0) continue;
    eligibleGroups.push({ vendorKey, items, eligibleSubtotal, subtotal });
  }

  if (eligibleGroups.length === 0) {
    return {
      ok: false,
      error:
        promo.vendorId || promo.categoryId
          ? "Промокод не подходит к товарам в корзине."
          : "Корзина пуста.",
    };
  }

  const totalEligibleSubtotal = eligibleGroups.reduce(
    (s, g) => s + g.eligibleSubtotal,
    0
  );

  if (promo.minSubtotal > 0 && totalEligibleSubtotal < promo.minSubtotal) {
    return {
      ok: false,
      error: `Для применения промокода нужна сумма от ${promo.minSubtotal} ₽.`,
    };
  }

  // Расчёт скидки.
  const breakdown: PromoDiscountBreakdown[] = [];

  if (promo.kind === "free_shipping") {
    if (input.deliveryKind === "pickup") {
      return {
        ok: false,
        error: "Промокод действует только при доставке.",
      };
    }
    for (const g of eligibleGroups) {
      breakdown.push({
        vendorKey: g.vendorKey,
        subtotal: g.subtotal,
        deliveryFee: input.deliveryFee,
        discountSubtotal: 0,
        discountShipping: input.deliveryFee,
      });
    }
    const totalDiscount = breakdown.reduce(
      (s, b) => s + b.discountShipping,
      0
    );
    return { ok: true, promo, totalDiscount, breakdown };
  }

  // percent / fixed — раскидываем пропорционально eligibleSubtotal.
  let totalDiscountTarget = 0;
  if (promo.kind === "percent") {
    const pct = Math.max(0, Math.min(100, promo.value));
    totalDiscountTarget = Math.floor((totalEligibleSubtotal * pct) / 100);
  } else if (promo.kind === "fixed") {
    totalDiscountTarget = Math.min(promo.value, totalEligibleSubtotal);
  }
  if (promo.maxDiscount > 0) {
    totalDiscountTarget = Math.min(totalDiscountTarget, promo.maxDiscount);
  }
  if (totalDiscountTarget <= 0) {
    return { ok: false, error: "Сумма скидки получилась нулевой." };
  }

  // Распределение по группам пропорционально eligibleSubtotal с учётом остатка.
  let distributed = 0;
  for (let i = 0; i < eligibleGroups.length; i += 1) {
    const g = eligibleGroups[i];
    const share =
      i === eligibleGroups.length - 1
        ? totalDiscountTarget - distributed
        : Math.floor(
            (totalDiscountTarget * g.eligibleSubtotal) / totalEligibleSubtotal
          );
    const capped = Math.min(share, g.eligibleSubtotal);
    breakdown.push({
      vendorKey: g.vendorKey,
      subtotal: g.subtotal,
      deliveryFee: input.deliveryFee,
      discountSubtotal: capped,
      discountShipping: 0,
    });
    distributed += capped;
  }

  return { ok: true, promo, totalDiscount: distributed, breakdown };
}
