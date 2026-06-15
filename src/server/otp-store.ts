import "server-only";
import { randomInt } from "crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type { SmsPurpose } from "./sms";

// Phase 7: store одноразовых паролей.
//
// Поведение:
//  • generateAndStore(phone, purpose) → создаёт новый код, ставит TTL 5 мин,
//    инвалидирует все предыдущие активные коды этой пары (phone, purpose).
//  • verify(phone, purpose, code) → проверяет код, инкрементит attempts.
//    После 5 неудачных попыток код считается просроченным.
//  • lastSentAt(phone, purpose) → когда был последний запрос (для rate-limit
//    «один SMS в 60 секунд»).
//
// Двухрежимность: Supabase (таблица otp_codes из миграции 0011) или память.

const TTL_MS = 5 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export type OtpEntry = {
  id: string;
  phone: string;
  purpose: SmsPurpose;
  code: string;
  attempts: number;
  consumedAt: string | null;
  requestedBy: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
};

type Row = {
  id: string;
  phone: string;
  purpose: SmsPurpose;
  code: string;
  attempts: number;
  consumed_at: string | null;
  requested_by: string | null;
  ip: string | null;
  created_at: string;
  expires_at: string;
};

function rowToEntry(r: Row): OtpEntry {
  return {
    id: r.id,
    phone: r.phone,
    purpose: r.purpose,
    code: r.code,
    attempts: r.attempts,
    consumedAt: r.consumed_at,
    requestedBy: r.requested_by,
    ip: r.ip,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  };
}

type Store = { codes: OtpEntry[] };
const globalKey = "__VKUSNOMARKET_OTP_STORE__";
function memory(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[globalKey]) g[globalKey] = { codes: [] };
  return g[globalKey]!;
}

function generateNumericCode(length = 6): string {
  let s = "";
  for (let i = 0; i < length; i++) s += randomInt(10).toString();
  return s;
}

function isActive(entry: OtpEntry, now = Date.now()): boolean {
  if (entry.consumedAt) return false;
  if (entry.attempts >= MAX_ATTEMPTS) return false;
  return new Date(entry.expiresAt).getTime() > now;
}

export type GenerateInput = {
  phone: string;
  purpose: SmsPurpose;
  ip?: string | null;
  requestedBy?: string | null;
};

export type GenerateResult =
  | { ok: true; entry: OtpEntry }
  | { ok: false; error: string; retryAfterMs?: number };

export async function lastSentAt(
  phone: string,
  purpose: SmsPurpose
): Promise<Date | null> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("otp_codes")
      .select("created_at")
      .eq("phone", phone)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return new Date((data as { created_at: string }).created_at);
  }
  const list = memory()
    .codes.filter((c) => c.phone === phone && c.purpose === purpose)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  return list[0] ? new Date(list[0].createdAt) : null;
}

export async function generateAndStore(
  input: GenerateInput
): Promise<GenerateResult> {
  const lastAt = await lastSentAt(input.phone, input.purpose);
  if (lastAt) {
    const elapsed = Date.now() - lastAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: "Подождите перед повторной отправкой.",
        retryAfterMs: RESEND_COOLDOWN_MS - elapsed,
      };
    }
  }
  const now = new Date();
  const entry: OtpEntry = {
    id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phone: input.phone,
    purpose: input.purpose,
    code: generateNumericCode(6),
    attempts: 0,
    consumedAt: null,
    requestedBy: input.requestedBy ?? null,
    ip: input.ip ?? null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TTL_MS).toISOString(),
  };

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    // Run invalidation + insert in parallel — insert uses a new unique ID so no conflict
    const [, insertResult] = await Promise.all([
      sb
        .from("otp_codes")
        .update({ consumed_at: now.toISOString() })
        .eq("phone", entry.phone)
        .eq("purpose", entry.purpose)
        .is("consumed_at", null),
      sb.from("otp_codes").insert({
        id: entry.id,
        phone: entry.phone,
        purpose: entry.purpose,
        code: entry.code,
        attempts: 0,
        consumed_at: null,
        requested_by: entry.requestedBy,
        ip: entry.ip,
        created_at: entry.createdAt,
        expires_at: entry.expiresAt,
      }),
    ]);
    if (insertResult.error) {
      return { ok: false, error: `otp insert: ${insertResult.error.message}` };
    }
    return { ok: true, entry };
  }

  const store = memory();
  for (const c of store.codes) {
    if (
      c.phone === entry.phone &&
      c.purpose === entry.purpose &&
      !c.consumedAt
    ) {
      c.consumedAt = now.toISOString();
    }
  }
  store.codes.push(entry);
  // Защита от роста в памяти.
  if (store.codes.length > 500) store.codes.splice(0, store.codes.length - 500);
  return { ok: true, entry };
}

/** Mark an OTP entry as consumed by ID (e.g. when SMS send fails). */
export async function consumeEntry(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    await sb
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", id);
    return;
  }
  const store = memory();
  const entry = store.codes.find((c) => c.id === id);
  if (entry) entry.consumedAt = new Date().toISOString();
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; error: string; attemptsLeft?: number };

export async function verify(
  phone: string,
  purpose: SmsPurpose,
  code: string
): Promise<VerifyResult> {
  const normalized = code.trim();
  if (!/^\d{4,8}$/.test(normalized)) {
    return { ok: false, error: "Введите код из SMS." };
  }

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("purpose", purpose)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error)
      return { ok: false, error: `otp lookup: ${error.message}` };
    if (!data) {
      return { ok: false, error: "Код истёк, запросите новый." };
    }
    const entry = rowToEntry(data as Row);
    if (!isActive(entry)) {
      return { ok: false, error: "Код истёк, запросите новый." };
    }
    if (entry.code !== normalized) {
      const attempts = entry.attempts + 1;
      await sb
        .from("otp_codes")
        .update({ attempts })
        .eq("id", entry.id);
      const left = MAX_ATTEMPTS - attempts;
      return {
        ok: false,
        error:
          left > 0
            ? `Неверный код. Осталось попыток: ${left}.`
            : "Слишком много попыток. Запросите новый код.",
        attemptsLeft: Math.max(0, left),
      };
    }
    await sb
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", entry.id);
    return { ok: true };
  }

  const store = memory();
  const list = store.codes
    .filter((c) => c.phone === phone && c.purpose === purpose && !c.consumedAt)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  const entry = list[0];
  if (!entry || !isActive(entry)) {
    return { ok: false, error: "Код истёк, запросите новый." };
  }
  if (entry.code !== normalized) {
    entry.attempts += 1;
    const left = MAX_ATTEMPTS - entry.attempts;
    return {
      ok: false,
      error:
        left > 0
          ? `Неверный код. Осталось попыток: ${left}.`
          : "Слишком много попыток. Запросите новый код.",
      attemptsLeft: Math.max(0, left),
    };
  }
  entry.consumedAt = new Date().toISOString();
  return { ok: true };
}
