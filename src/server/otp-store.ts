import "server-only";
import { randomInt, createHash, timingSafeEqual } from "crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type { SmsPurpose } from "./sms";

// OTP store — хранилище одноразовых кодов подтверждения.
//
// Безопасность:
//  • Код хранится как SHA-256 хеш (не в открытом виде).
//  • Сравнение через timingSafeEqual (защита от timing-атак).
//  • TTL 5 минут, максимум 5 попыток ввода.
//  • Rate-limit: 1 код в 60 сек на номер, макс 10 в день на номер.
//
// Двухрежимность: Supabase (таблица otp_codes) или in-memory (dev/preview).

const TTL_MS = 5 * 60 * 1000; // 5 минут
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 секунд
const MAX_ATTEMPTS = 5;
const MAX_DAILY_SENDS = 10;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function safeCompare(input: string, stored: string): boolean {
  const a = Buffer.from(hashCode(input), "hex");
  const b = Buffer.from(stored, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type OtpEntry = {
  id: string;
  phone: string;
  purpose: SmsPurpose;
  codeHash: string;
  shortCodeHash: string; // first 4 digits hash (for voice call)
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
  code: string; // DB column name is `code` but stores hash
  attempts: number;
  consumed_at: string | null;
  requested_by: string | null;
  ip: string | null;
  created_at: string;
  expires_at: string;
};

function rowToEntry(r: Row): OtpEntry {
  // `code` column stores "hash|shortHash" format
  const [codeHash, shortCodeHash] = r.code.split("|");
  return {
    id: r.id,
    phone: r.phone,
    purpose: r.purpose,
    codeHash: codeHash ?? r.code,
    shortCodeHash: shortCodeHash ?? codeHash ?? r.code,
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
  | { ok: true; code: string; entryId: string }
  | { ok: false; error: string; retryAfterMs?: number };

async function countDailySends(phone: string, purpose: SmsPurpose): Promise<number> {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { count, error } = await sb
      .from("otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .eq("purpose", purpose)
      .gte("created_at", dayStart.toISOString());
    if (error) return 0;
    return count ?? 0;
  }
  return memory().codes.filter(
    (c) =>
      c.phone === phone &&
      c.purpose === purpose &&
      new Date(c.createdAt) >= dayStart
  ).length;
}

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
  // Rate limit: 1 SMS per 60 seconds
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

  // Rate limit: max 10 per day per phone
  const dailyCount = await countDailySends(input.phone, input.purpose);
  if (dailyCount >= MAX_DAILY_SENDS) {
    return {
      ok: false,
      error: "Превышен лимит отправок на сегодня. Попробуйте завтра.",
    };
  }

  const now = new Date();
  const plainCode = generateNumericCode(6);
  const shortCode = plainCode.slice(0, 4);
  const codeHash = hashCode(plainCode);
  const shortCodeHash = hashCode(shortCode);

  const entry: OtpEntry = {
    id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phone: input.phone,
    purpose: input.purpose,
    codeHash,
    shortCodeHash,
    attempts: 0,
    consumedAt: null,
    requestedBy: input.requestedBy ?? null,
    ip: input.ip ?? null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TTL_MS).toISOString(),
  };

  // Store hashes in "hash|shortHash" format in the `code` column
  const dbCodeValue = `${codeHash}|${shortCodeHash}`;

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
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
        code: dbCodeValue,
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
    return { ok: true, code: plainCode, entryId: entry.id };
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
  if (store.codes.length > 500) store.codes.splice(0, store.codes.length - 500);
  return { ok: true, code: plainCode, entryId: entry.id };
}

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
    return { ok: false, error: "Введите код подтверждения." };
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
    if (error) return { ok: false, error: `otp lookup: ${error.message}` };
    if (!data) return { ok: false, error: "Код истёк, запросите новый." };

    const entry = rowToEntry(data as Row);
    if (!isActive(entry)) {
      return { ok: false, error: "Код истёк, запросите новый." };
    }

    // Compare using timing-safe hash comparison
    const matchesFull = safeCompare(normalized, entry.codeHash);
    const matchesShort = safeCompare(normalized, entry.shortCodeHash);

    if (!matchesFull && !matchesShort) {
      const attempts = entry.attempts + 1;
      await sb.from("otp_codes").update({ attempts }).eq("id", entry.id);
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

  // In-memory store
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

  const matchesFull = safeCompare(normalized, entry.codeHash);
  const matchesShort = safeCompare(normalized, entry.shortCodeHash);

  if (!matchesFull && !matchesShort) {
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
