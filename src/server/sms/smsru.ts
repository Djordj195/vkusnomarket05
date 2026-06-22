import "server-only";
import type { SmsProvider, SendCodeResult, SmsPurpose } from "./types";
import { buildSmsText } from "./types";

// SMS.ru — провайдер SMS с голосовым fallback.
//
// Стратегия отправки OTP (с exponential backoff):
//  1. SMS без sender name (лучшая доставляемость — операторы не фильтруют)
//  2. Голосовой звонок (code/call) — fallback если SMS не прошёл
//
// Для OTP никогда не используем sender name — это частая причина
// блокировки на стороне операторов (МегаФон, Теле2).
//
// Retry: до 2 повторов на каждый шаг при транзиентных ошибках.
// Backoff: 500ms → 1000ms.

type SmsruEnv = {
  apiId: string;
  sender?: string;
};

function readEnv(): SmsruEnv | null {
  const apiId = process.env.SMSRU_API_ID;
  if (!apiId) return null;
  return { apiId, sender: process.env.SMSRU_SENDER || undefined };
}

export function isSmsruConfigured(): boolean {
  return readEnv() !== null;
}

const STATUS_MESSAGES: Record<number, string> = {
  200: "Неверный API ID",
  201: "Недостаточно средств на балансе SMS.ru",
  202: "Неверный номер получателя",
  203: "Нет текста сообщения",
  204: "Имя отправителя не одобрено",
  205: "Сообщение слишком длинное",
  206: "Превышен дневной лимит сообщений",
  207: "Невозможно отправить на этот номер",
  208: "Неправильное время для отправки",
  209: "Отправка запрещена (стоп-лист)",
  210: "Используйте POST для отправки",
  220: "Сервис временно недоступен",
  230: "Превышен лимит сообщений в день",
  231: "Превышен лимит одинаковых сообщений в минуту",
  232: "Превышен лимит одинаковых сообщений в день",
};

type SmsruResponse = {
  status: string;
  status_code: number;
  sms?: Record<string, {
    status?: string;
    status_code?: number;
    sms_id?: string;
    status_text?: string;
  }>;
  status_text?: string;
  balance?: number;
};

function isTransientError(error: string): boolean {
  const lower = error.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("abort") ||
    lower.includes("network") ||
    lower.includes("econnreset") ||
    lower.includes("econnrefused") ||
    lower.includes("http 5") ||
    lower.includes("temporarily unavailable")
  );
}

async function doSend(
  phone: string,
  message: string,
  sender?: string
): Promise<SendCodeResult> {
  const env = readEnv();
  if (!env) return { ok: false, error: "SMS.ru не сконфигурирован." };

  const body = new URLSearchParams({
    api_id: env.apiId,
    to: phone,
    msg: message,
    json: "1",
  });
  if (sender) body.set("from", sender);

  console.info(`[sms.ru] POST to ${phone.slice(0, 4)}**** sender=${sender ?? "(default)"}`);

  const res = await fetch("https://sms.ru/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    console.error(`[sms.ru] HTTP ${res.status}`);
    return { ok: false, error: `SMS.ru HTTP ${res.status}` };
  }
  const json = (await res.json()) as SmsruResponse;
  console.info(`[sms.ru] response: status=${json.status} code=${json.status_code} balance=${json.balance ?? "??"}`);

  if (json.status !== "OK") {
    const code = json.status_code;
    const msg = STATUS_MESSAGES[code] ?? json.status_text ?? `Ошибка ${code}`;
    console.error(`[sms.ru] global error: ${msg}`);
    return { ok: false, error: msg, statusCode: code };
  }

  const firstSms = json.sms ? Object.values(json.sms)[0] : undefined;
  if (firstSms && firstSms.status_code && firstSms.status_code !== 100) {
    const code = firstSms.status_code;
    const msg = STATUS_MESSAGES[code] ?? firstSms.status_text ?? `Ошибка ${code}`;
    console.error(`[sms.ru] per-phone error: ${msg}`);
    return { ok: false, error: msg, statusCode: code };
  }

  return { ok: true, providerMessageId: firstSms?.sms_id, method: "sms" as const };
}

async function doCallSend(phone: string, code: string): Promise<SendCodeResult> {
  const env = readEnv();
  if (!env) return { ok: false, error: "SMS.ru не сконфигурирован." };

  const shortCode = code.slice(0, 4);
  const body = new URLSearchParams({
    api_id: env.apiId,
    phone,
    code: shortCode,
    json: "1",
  });

  console.info(`[sms.ru] code/call to ${phone.slice(0, 4)}****`);

  const res = await fetch("https://sms.ru/code/call", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    console.error(`[sms.ru] code/call HTTP ${res.status}`);
    return { ok: false, error: `SMS.ru HTTP ${res.status}` };
  }
  const json = (await res.json()) as SmsruResponse;
  console.info(`[sms.ru] code/call response: status=${json.status} code=${json.status_code}`);

  if (json.status !== "OK") {
    const sc = json.status_code;
    const msg = STATUS_MESSAGES[sc] ?? json.status_text ?? `Ошибка ${sc}`;
    console.error(`[sms.ru] code/call error: ${msg}`);
    return { ok: false, error: msg, statusCode: sc };
  }

  return { ok: true, method: "call" as const };
}

async function withRetry(
  fn: () => Promise<SendCodeResult>,
  maxRetries = 2,
  baseDelay = 500
): Promise<SendCodeResult> {
  let lastResult: SendCodeResult = { ok: false, error: "Не удалось отправить." };
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (result.ok) return result;
      lastResult = result;
      // Don't retry non-transient errors
      if (!isTransientError(result.error)) return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Сетевая ошибка";
      lastResult = { ok: false, error: msg };
      if (!isTransientError(msg)) return lastResult;
    }
    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return lastResult;
}

async function send(phone: string, message: string, code?: string): Promise<SendCodeResult> {
  const env = readEnv();
  if (!env) return { ok: false, error: "SMS.ru не сконфигурирован." };

  // Для OTP-кодов: SMS ПЕРВЫЙ, голосовой звонок — только если SMS не прошёл.
  // Для OTP НЕ используем sender name — это частая причина фильтрации на операторах.
  if (code) {
    // Step 1: SMS без sender name (надёжнее для OTP — операторы не фильтруют)
    console.info(`[sms.ru] step1: sending OTP via SMS (no sender — best deliverability)`);
    const smsResult = await withRetry(() => doSend(phone, message), 2);
    if (smsResult.ok) {
      console.info(`[sms.ru] step1 OK: sms_id=${smsResult.providerMessageId}`);
      return smsResult;
    }
    console.warn(`[sms.ru] step1 (sms) failed: ${smsResult.error} (code=${smsResult.statusCode})`);

    // Step 2: Голосовой звонок (fallback если SMS не доставляется)
    console.info(`[sms.ru] step2: fallback to voice call (code/call)`);
    const callResult = await withRetry(() => doCallSend(phone, code), 2);
    if (callResult.ok) {
      console.info(`[sms.ru] step2 OK: voice call initiated`);
      return callResult;
    }
    console.error(`[sms.ru] step2 (call) also failed: ${callResult.error}`);
    // Return SMS error since it's the primary method
    return { ok: false, error: smsResult.error, statusCode: smsResult.statusCode };
  }

  // For plain text messages (not OTP): use SMS with sender if available
  if (env.sender) {
    console.info(`[sms.ru] text-send: trying SMS with sender="${env.sender}"`);
    const result = await withRetry(() => doSend(phone, message, env.sender), 1);
    if (result.ok) return result;
    console.warn(`[sms.ru] text-send with sender failed: ${result.error}`);
  }

  console.info(`[sms.ru] text-send: trying SMS without sender`);
  return withRetry(() => doSend(phone, message), 1);
}

export class SmsruProvider implements SmsProvider {
  readonly name = "sms.ru";
  readonly isDemo = false;

  sendCode(phone: string, code: string, purpose: SmsPurpose): Promise<SendCodeResult> {
    return send(phone, buildSmsText(code, purpose), code);
  }

  sendText(phone: string, text: string): Promise<SendCodeResult> {
    return send(phone, text);
  }
}
