import "server-only";
import type { PaymentReceipt } from "@/lib/types";

// Phase 8: ЮKassa HTTP-клиент.
//
// Документация: https://yookassa.ru/developers/api
//
// ENV-переменные:
//   YOOKASSA_SHOP_ID      — shopId магазина
//   YOOKASSA_SECRET_KEY   — secret или test_secret
//   YOOKASSA_RETURN_URL   — куда возвращать клиента после оплаты
//                            (по умолчанию — публичный URL сайта)
//   YOOKASSA_TAX_SYSTEM   — налоговый режим (1..6), по умолчанию 2 (УСН доход)
//
// Если переменные пустые — `isYookassaConfigured()` вернёт false, и
// уровень выше переключится на demo-режим (auto-confirm после редиректа).

const API_BASE = "https://api.yookassa.ru/v3";

export type YooEnv = {
  shopId: string;
  secretKey: string;
  returnUrl: string;
  taxSystemCode: 1 | 2 | 3 | 4 | 5 | 6;
};

export function readYooEnv(): YooEnv | null {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return null;
  const taxSystemCode = clampTaxCode(process.env.YOOKASSA_TAX_SYSTEM);
  return {
    shopId,
    secretKey,
    returnUrl:
      process.env.YOOKASSA_RETURN_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://vkusnomarket05.vercel.app",
    taxSystemCode,
  };
}

function clampTaxCode(v: string | undefined): 1 | 2 | 3 | 4 | 5 | 6 {
  const n = Number(v ?? 2);
  if (n >= 1 && n <= 6) return n as 1 | 2 | 3 | 4 | 5 | 6;
  return 2;
}

export function isYookassaConfigured(): boolean {
  return readYooEnv() !== null;
}

function authHeader(env: YooEnv): string {
  return `Basic ${Buffer.from(`${env.shopId}:${env.secretKey}`).toString("base64")}`;
}

// Преобразует копейки → "1234.56" строкой как требует ЮKassa.
function kopToAmountString(kop: number): string {
  const rub = Math.floor(kop / 100);
  const cents = kop % 100;
  return `${rub}.${cents.toString().padStart(2, "0")}`;
}

export type YooCreatePaymentInput = {
  amountKop: number;
  currency?: string;
  description: string;
  idempotencyKey: string;
  returnUrl?: string;
  receipt?: PaymentReceipt;
  metadata?: Record<string, string>;
};

// Минимально-достаточный тип ответа ЮKassa, который мы используем
// (полный объект кладётся в `payments.raw`).
export type YooPaymentResponse = {
  id: string;
  status:
    | "pending"
    | "waiting_for_capture"
    | "succeeded"
    | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  description?: string;
  confirmation?: {
    type: "redirect" | "embedded";
    confirmation_url?: string;
  };
  test?: boolean;
  refunded_amount?: { value: string; currency: string };
};

function buildReceiptBody(
  receipt: PaymentReceipt,
  taxSystemCode: number
): Record<string, unknown> {
  return {
    customer: {
      ...(receipt.customer.phone
        ? { phone: receipt.customer.phone.replace(/\D/g, "") }
        : {}),
      ...(receipt.customer.email ? { email: receipt.customer.email } : {}),
    },
    tax_system_code: taxSystemCode,
    items: receipt.items.map((it) => ({
      description: it.description,
      quantity: it.quantity.toFixed(3),
      amount: {
        value: kopToAmountString(it.amountKop),
        currency: "RUB",
      },
      vat_code: it.vatCode,
      payment_mode: it.paymentMode,
      payment_subject: it.paymentSubject,
    })),
  };
}

export async function yooCreatePayment(
  input: YooCreatePaymentInput
): Promise<
  | { ok: true; data: YooPaymentResponse }
  | { ok: false; error: string }
> {
  const env = readYooEnv();
  if (!env) return { ok: false, error: "ЮKassa не сконфигурирован." };

  const body: Record<string, unknown> = {
    amount: {
      value: kopToAmountString(input.amountKop),
      currency: input.currency ?? "RUB",
    },
    capture: true,
    description: input.description,
    confirmation: {
      type: "redirect",
      return_url: input.returnUrl ?? env.returnUrl,
    },
  };
  if (input.metadata) body.metadata = input.metadata;
  if (input.receipt) {
    body.receipt = buildReceiptBody(input.receipt, env.taxSystemCode);
  }

  try {
    const res = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: authHeader(env),
        "Content-Type": "application/json",
        "Idempotence-Key": input.idempotencyKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json()) as
      | YooPaymentResponse
      | { type: string; description: string; code?: string };
    if (!res.ok || !("id" in json)) {
      const err =
        "description" in json ? json.description : `HTTP ${res.status}`;
      return { ok: false, error: `ЮKassa: ${err}` };
    }
    return { ok: true, data: json };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "ЮKassa network error",
    };
  }
}

export async function yooGetPayment(
  paymentId: string
): Promise<
  | { ok: true; data: YooPaymentResponse }
  | { ok: false; error: string }
> {
  const env = readYooEnv();
  if (!env) return { ok: false, error: "ЮKassa не сконфигурирован." };
  try {
    const res = await fetch(`${API_BASE}/payments/${paymentId}`, {
      headers: { Authorization: authHeader(env) },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `ЮKassa HTTP ${res.status}` };
    const data = (await res.json()) as YooPaymentResponse;
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "ЮKassa network error",
    };
  }
}

export type YooRefundInput = {
  paymentId: string;
  amountKop: number;
  description?: string;
  idempotencyKey: string;
};

export type YooRefundResponse = {
  id: string;
  status: "pending" | "succeeded" | "canceled";
  amount: { value: string; currency: string };
  payment_id: string;
};

export async function yooCreateRefund(
  input: YooRefundInput
): Promise<
  | { ok: true; data: YooRefundResponse }
  | { ok: false; error: string }
> {
  const env = readYooEnv();
  if (!env) return { ok: false, error: "ЮKassa не сконфигурирован." };
  try {
    const res = await fetch(`${API_BASE}/refunds`, {
      method: "POST",
      headers: {
        Authorization: authHeader(env),
        "Content-Type": "application/json",
        "Idempotence-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        payment_id: input.paymentId,
        amount: {
          value: kopToAmountString(input.amountKop),
          currency: "RUB",
        },
        description: input.description,
      }),
      cache: "no-store",
    });
    const json = (await res.json()) as
      | YooRefundResponse
      | { type: string; description: string };
    if (!res.ok || !("id" in json)) {
      const err =
        "description" in json ? json.description : `HTTP ${res.status}`;
      return { ok: false, error: `ЮKassa refund: ${err}` };
    }
    return { ok: true, data: json };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "ЮKassa network error",
    };
  }
}

export { kopToAmountString };
