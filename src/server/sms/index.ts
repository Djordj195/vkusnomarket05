import "server-only";
import { DemoSmsProvider } from "./demo";
import { SmscProvider, isSmscConfigured } from "./smsc";
import { SmsruProvider, isSmsruConfigured } from "./smsru";
import type { SmsProvider } from "./types";

// Выбор провайдера:
//   SMS_PROVIDER=smsc → SMSC.ru
//   SMS_PROVIDER=smsru → SMS.ru
//   SMS_PROVIDER=demo (или не задан + нет креден) → DemoSmsProvider
// Если SMS_PROVIDER не задан, авто-выбираем первый сконфигурированный.

export function getSmsProvider(): SmsProvider {
  const explicit = (process.env.SMS_PROVIDER || "").toLowerCase();

  if (explicit === "smsc" || (explicit === "" && isSmscConfigured())) {
    return new SmscProvider();
  }
  if (explicit === "smsru" || (explicit === "" && isSmsruConfigured())) {
    return new SmsruProvider();
  }
  return new DemoSmsProvider();
}

export function isSmsRealProviderConfigured(): boolean {
  const explicit = (process.env.SMS_PROVIDER || "").toLowerCase();
  if (explicit === "demo") return false;
  if (explicit === "smsc") return isSmscConfigured();
  if (explicit === "smsru") return isSmsruConfigured();
  return isSmscConfigured() || isSmsruConfigured();
}

export { buildSmsText, normalizeRuPhone } from "./types";
export type { SmsPurpose, SendCodeResult, SmsProvider } from "./types";
