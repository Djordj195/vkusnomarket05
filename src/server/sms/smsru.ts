import "server-only";
import type { SmsProvider, SendCodeResult, SmsPurpose } from "./types";
import { buildSmsText } from "./types";

// SMS.ru — альтернативный провайдер. Free dev-режим (бесплатные тестовые
// отправки) + платные тарифы. Аутентификация по API-ID.
//
// ENV-переменные:
//   SMSRU_API_ID  — API ID из личного кабинета sms.ru
//   SMSRU_SENDER  — sender (буквенный, опционально)
//
// API: https://sms.ru/api/send

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

async function send(phone: string, message: string): Promise<SendCodeResult> {
  const env = readEnv();
  if (!env) return { ok: false, error: "SMS.ru не сконфигурирован." };

  const params = new URLSearchParams({
    api_id: env.apiId,
    to: phone,
    msg: message,
    json: "1",
  });
  if (env.sender) params.set("from", env.sender);

  try {
    const url = `https://sms.ru/sms/send?${params.toString()}`;
    console.info(`[sms.ru] sending to ${phone.slice(0, 4)}****`);

    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) {
      console.error(`[sms.ru] HTTP ${res.status}`);
      return { ok: false, error: `SMS.ru HTTP ${res.status}` };
    }
    const json = (await res.json()) as {
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

    console.info(`[sms.ru] response: status=${json.status} code=${json.status_code} balance=${json.balance ?? "??"}`);

    // Глобальная ошибка (неверный api_id, нет баланса и т.д.)
    if (json.status !== "OK") {
      const msg = STATUS_MESSAGES[json.status_code]
        ?? json.status_text
        ?? `Ошибка ${json.status_code}`;
      console.error(`[sms.ru] global error: ${msg}`);
      return { ok: false, error: `SMS.ru: ${msg}` };
    }

    // Проверяем статус конкретного SMS (может отличаться от глобального)
    const firstSms = json.sms ? Object.values(json.sms)[0] : undefined;
    if (firstSms) {
      console.info(`[sms.ru] per-phone: status=${firstSms.status} code=${firstSms.status_code} id=${firstSms.sms_id ?? "-"}`);
      if (firstSms.status_code && firstSms.status_code !== 100) {
        const msg = STATUS_MESSAGES[firstSms.status_code]
          ?? firstSms.status_text
          ?? `Ошибка отправки ${firstSms.status_code}`;
        console.error(`[sms.ru] per-phone error: ${msg}`);
        return { ok: false, error: `SMS.ru: ${msg}` };
      }
    }

    return { ok: true, providerMessageId: firstSms?.sms_id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SMS.ru network error";
    console.error(`[sms.ru] exception: ${msg}`);
    return { ok: false, error: msg };
  }
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
