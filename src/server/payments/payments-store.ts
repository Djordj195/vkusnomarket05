import "server-only";
import type {
  Payment,
  PaymentProvider,
  PaymentReceipt,
  PaymentRefund,
  PaymentStatus,
} from "@/lib/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase";

// Двухрежимное хранилище платежей (см. orders-store).

type Store = { payments: Payment[] };
const globalKey = "__VKUSNOMARKET_PAYMENTS_STORE__";

function getMemoryStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[globalKey]) g[globalKey] = { payments: [] };
  return g[globalKey]!;
}

type PaymentRow = {
  id: string;
  checkout_group_id: string;
  amount_kop: number;
  currency: string;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  status: PaymentStatus;
  idempotency_key: string | null;
  confirmation_url: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  receipt: PaymentReceipt | null;
  raw: unknown;
  refunded_kop: number;
  refunds: PaymentRefund[];
  created_at: string;
  updated_at: string;
};

function rowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    checkoutGroupId: row.checkout_group_id,
    amountKop: row.amount_kop,
    currency: row.currency,
    provider: row.provider,
    providerPaymentId: row.provider_payment_id,
    status: row.status,
    idempotencyKey: row.idempotency_key,
    confirmationUrl: row.confirmation_url,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    receipt: row.receipt,
    refundedKop: row.refunded_kop,
    refunds: row.refunds ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function paymentToRow(p: Payment, raw?: unknown): PaymentRow {
  return {
    id: p.id,
    checkout_group_id: p.checkoutGroupId,
    amount_kop: p.amountKop,
    currency: p.currency,
    provider: p.provider,
    provider_payment_id: p.providerPaymentId,
    status: p.status,
    idempotency_key: p.idempotencyKey,
    confirmation_url: p.confirmationUrl,
    customer_phone: p.customerPhone,
    customer_email: p.customerEmail,
    receipt: p.receipt,
    raw: raw ?? null,
    refunded_kop: p.refundedKop,
    refunds: p.refunds,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export async function savePayment(
  payment: Payment,
  raw?: unknown
): Promise<Payment> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb.from("payments").upsert(paymentToRow(payment, raw));
    if (error) throw new Error(`savePayment: ${error.message}`);
    return payment;
  }
  const store = getMemoryStore();
  const idx = store.payments.findIndex((p) => p.id === payment.id);
  if (idx === -1) store.payments.unshift(payment);
  else store.payments[idx] = payment;
  return payment;
}

export async function getPaymentById(id: string): Promise<Payment | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`getPaymentById: ${error.message}`);
    return data ? rowToPayment(data as PaymentRow) : undefined;
  }
  return getMemoryStore().payments.find((p) => p.id === id);
}

export async function getPaymentByProviderId(
  providerPaymentId: string
): Promise<Payment | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("payments")
      .select("*")
      .eq("provider_payment_id", providerPaymentId)
      .maybeSingle();
    if (error)
      throw new Error(`getPaymentByProviderId: ${error.message}`);
    return data ? rowToPayment(data as PaymentRow) : undefined;
  }
  return getMemoryStore().payments.find(
    (p) => p.providerPaymentId === providerPaymentId
  );
}

export async function listPayments(opts?: {
  status?: PaymentStatus;
  limit?: number;
}): Promise<Payment[]> {
  const limit = opts?.limit ?? 100;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    let q = sb
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (opts?.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error) throw new Error(`listPayments: ${error.message}`);
    return (data as PaymentRow[]).map(rowToPayment);
  }
  let arr = [...getMemoryStore().payments];
  if (opts?.status) arr = arr.filter((p) => p.status === opts.status);
  arr.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return arr.slice(0, limit);
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  raw?: unknown
): Promise<Payment | undefined> {
  const existing = await getPaymentById(id);
  if (!existing) return undefined;
  const updated: Payment = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };
  await savePayment(updated, raw);
  return updated;
}

export async function appendRefund(
  paymentId: string,
  refund: PaymentRefund
): Promise<Payment | undefined> {
  const existing = await getPaymentById(paymentId);
  if (!existing) return undefined;
  const refunds = [...existing.refunds, refund];
  const refundedKop = existing.refundedKop + refund.amountKop;
  const status: PaymentStatus =
    refundedKop >= existing.amountKop ? "refunded" : "partially_refunded";
  const updated: Payment = {
    ...existing,
    refunds,
    refundedKop,
    status,
    updatedAt: new Date().toISOString(),
  };
  await savePayment(updated);
  return updated;
}
