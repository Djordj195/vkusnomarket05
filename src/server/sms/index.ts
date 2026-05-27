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

let cached: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (cached) return cached;
  const explicit = (process.env.SMS_PROVIDER || "").toLowerCase();

  if (explicit === "smsc" || (explicit === "" && isSmscConfigured())) {
    cached = new SmscProvider();
    return cached;
  }
  if (explicit === "smsru" || (explicit === "" && isSmsruConfigured())) {
    cached = new SmsruProvider();
    return cached;
  }
  cached = new DemoSmsProvider();
  return cached;
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
