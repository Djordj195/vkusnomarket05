import "server-only";
import type { SmsProvider, SendCodeResult, SmsPurpose } from "./types";
import { buildSmsText } from "./types";

// SMSC.ru — самый дешёвый российский провайдер. Аутентификация по
// связке логин + пароль (или md5(пароль) / API-ключ).
//
// ENV-переменные:
//   SMSC_LOGIN      — логин кабинета smsc.ru
//   SMSC_PASSWORD   — пароль (или md5-хеш, если SMSC_PASSWORD_IS_MD5=1)
//   SMSC_SENDER     — sender (буквенный, опционально)
//   SMSC_PASSWORD_IS_MD5 — "1" если в SMSC_PASSWORD уже md5-хеш
//
// API: https://smsc.ru/api/http/send-sms/

type SmscEnv = {
  login: string;
  password: string;
  sender?: string;
  passwordIsMd5: boolean;
};

function readEnv(): SmscEnv | null {
  const login = process.env.SMSC_LOGIN;
  const password = process.env.SMSC_PASSWORD;
  if (!login || !password) return null;
  return {
    login,
    password,
    sender: process.env.SMSC_SENDER || undefined,
    passwordIsMd5: process.env.SMSC_PASSWORD_IS_MD5 === "1",
  };
}

export function isSmscConfigured(): boolean {
  return readEnv() !== null;
}

export class SmscProvider implements SmsProvider {
  readonly name = "smsc.ru";
  readonly isDemo = false;

  async sendCode(
    phone: string,
    code: string,
    purpose: SmsPurpose
  ): Promise<SendCodeResult> {
    const env = readEnv();
    if (!env) return { ok: false, error: "SMSC.ru не сконфигурирован." };

    const message = buildSmsText(code, purpose);
    const params = new URLSearchParams({
      login: env.login,
      psw: env.password,
      phones: phone,
      mes: message,
      fmt: "3", // JSON
      charset: "utf-8",
    });
    if (env.sender) params.set("sender", env.sender);

    try {
      const res = await fetch(
        `https://smsc.ru/sys/send.php?${params.toString()}`,
        { method: "GET", cache: "no-store" }
      );
      if (!res.ok) {
        return { ok: false, error: `SMSC HTTP ${res.status}` };
      }
      const json = (await res.json()) as {
        id?: number;
        cnt?: number;
        error?: string;
        error_code?: number;
      };
      if (json.error) {
        return {
          ok: false,
          error: `SMSC error ${json.error_code ?? "?"}: ${json.error}`,
        };
      }
      return { ok: true, providerMessageId: json.id ? String(json.id) : undefined };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "SMSC network error",
      };
    }
  }
}
