import "server-only";
import type { SmsProvider, SendCodeResult, SmsPurpose } from "./types";
import { buildSmsText } from "./types";

// SMS.ru — провайдер SMS. Аутентификация по API-ID.
//
// ENV-переменные:
//   SMSRU_API_ID  — API ID из личного кабинета sms.ru
//   SMSRU_SENDER  — sender (буквенный, опционально)
//
// API: https://sms.ru/sms/send (POST, json=1)

type SmsruEnv = {
  apiId: string;
  sender?: string;
};

function readEnv(): SmsruEnv | null {
  const apiId = process.env.SMSRU_API_ID;
  if (!apiId) return null;
  return {
    apiId,
    sender: process.env.SMSRU_SENDER || undefined,
  };
}

export function isSmsruConfigured(): boolean {
  return readEnv() !== null;
}

// SMS.ru status codes:
// 100 = принято к отправке, 200 = неверный api_id, 201 = нет денег,
// 202 = неверный получатель, 204 = отправитель не одобрен, 207 = нельзя отправить на номер
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
  209: "Отправка запрещена (добавлен в стоп-лист)",
  210: "Используйте POST для отправки",
  211: "Метод не найден",
  212: "Текст сообщения необходимо передать в кодировке UTF-8",
  220: "Сервис временно недоступен",
  230: "Превышен лимит сообщений в день (более 60)",
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
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    console.error(`[sms.ru] HTTP ${res.status}`);
    return { ok: false, error: `SMS.ru HTTP ${res.status}` };
  }
  const json = (await res.json()) as SmsruResponse;

  console.info(`[sms.ru] response: status=${json.status} code=${json.status_code} balance=${json.balance ?? "??"}`);

  // Глобальная ошибка (неверный api_id, нет баланса и т.д.)
  if (json.status !== "OK") {
    const code = json.status_code;
    const msg = STATUS_MESSAGES[code] ?? json.status_text ?? `Ошибка ${code}`;
    console.error(`[sms.ru] global error: ${msg}`);
    return { ok: false, error: msg, statusCode: code };
  }

  // Проверяем статус конкретного SMS (может отличаться от глобального)
  const firstSms = json.sms ? Object.values(json.sms)[0] : undefined;
  if (firstSms) {
    console.info(`[sms.ru] per-phone: status=${firstSms.status} code=${firstSms.status_code} id=${firstSms.sms_id ?? "-"}`);
    if (firstSms.status_code && firstSms.status_code !== 100) {
      const code = firstSms.status_code;
      const msg = STATUS_MESSAGES[code] ?? firstSms.status_text ?? `Ошибка отправки ${code}`;
      console.error(`[sms.ru] per-phone error: ${msg}`);
      return { ok: false, error: msg, statusCode: code };
    }
  }

  return { ok: true, providerMessageId: firstSms?.sms_id };
}

async function send(phone: string, message: string): Promise<SendCodeResult> {
  const env = readEnv();
  if (!env) return { ok: false, error: "SMS.ru не сконфигурирован." };

  // Strategy: try with SMSRU_SENDER first (if set), then without.
  // SMS.ru requires an approved sender — some accounts need `from`, others work without it.
  const attempts: Array<string | undefined> = env.sender
    ? [env.sender, undefined]
    : [undefined];

  try {
    for (let i = 0; i < attempts.length; i++) {
      const sender = attempts[i];
      const result = await doSend(phone, message, sender);

      // If sender not approved (204), try the next option
      if (!result.ok && result.statusCode === 204 && i < attempts.length - 1) {
        console.info(`[sms.ru] sender=${sender ?? "(none)"} rejected (204), trying next option`);
        continue;
      }

      // Retry once on transient network errors
      if (!result.ok && isTransientError(result.error)) {
        console.info("[sms.ru] transient error, retrying once...");
        await new Promise((r) => setTimeout(r, 300));
        return await doSend(phone, message, sender);
      }

      // If final 204 — provide actionable instructions
      if (!result.ok && result.statusCode === 204) {
        return {
          ok: false,
          error: "SMS.ru требует одобренного отправителя. Зайдите на sms.ru → Отправители → создайте и дождитесь одобрения.",
          statusCode: 204,
        };
      }

      return result;
    }

    // Fallback (shouldn't reach here)
    return await doSend(phone, message, undefined);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SMS.ru network error";
    console.error(`[sms.ru] exception: ${msg}`);
    try {
      await new Promise((r) => setTimeout(r, 300));
      return await doSend(phone, message, undefined);
    } catch (e2) {
      const msg2 = e2 instanceof Error ? e2.message : "SMS.ru network error";
      return { ok: false, error: msg2 };
    }
  }
}

function isTransientError(error: string): boolean {
  const lower = error.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("abort") ||
    lower.includes("network") ||
    lower.includes("econnreset") ||
    lower.includes("http 5")
  );
}

export class SmsruProvider implements SmsProvider {
  readonly name = "sms.ru";
  readonly isDemo = false;

  sendCode(
    phone: string,
    code: string,
    purpose: SmsPurpose
  ): Promise<SendCodeResult> {
    return send(phone, buildSmsText(code, purpose));
  }

  sendText(phone: string, text: string): Promise<SendCodeResult> {
    return send(phone, text);
  }
}
