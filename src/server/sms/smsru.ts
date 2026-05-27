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

export class SmsruProvider implements SmsProvider {
  readonly name = "sms.ru";
  readonly isDemo = false;

  async sendCode(
    phone: string,
    code: string,
    purpose: SmsPurpose
  ): Promise<SendCodeResult> {
    const env = readEnv();
    if (!env) return { ok: false, error: "SMS.ru не сконфигурирован." };

    const message = buildSmsText(code, purpose);
    const params = new URLSearchParams({
      api_id: env.apiId,
      to: phone,
      msg: message,
      json: "1",
    });
    if (env.sender) params.set("from", env.sender);

    try {
      const res = await fetch(
        `https://sms.ru/sms/send?${params.toString()}`,
        { method: "GET", cache: "no-store" }
      );
      if (!res.ok) {
        return { ok: false, error: `SMS.ru HTTP ${res.status}` };
      }
      const json = (await res.json()) as {
        status: string;
        status_code: number;
        sms?: Record<string, { status?: string; sms_id?: string; status_text?: string }>;
        status_text?: string;
      };
      if (json.status !== "OK") {
        return {
          ok: false,
          error: `SMS.ru: ${json.status_text ?? json.status}`,
        };
      }
      const firstSms = json.sms ? Object.values(json.sms)[0] : undefined;
      return { ok: true, providerMessageId: firstSms?.sms_id };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "SMS.ru network error",
      };
    }
  }
}
