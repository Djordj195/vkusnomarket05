import "server-only";

// Phase 7: единый интерфейс для SMS-провайдеров.
// Любой adapter реализует `sendCode(phone, code)` → возвращает true при успехе.
// Если провайдер не сконфигурирован — выбирается `DemoSmsProvider`, который
// просто логирует код в server-console (preview-режим).

export type DeliveryMethod = "sms" | "call";

export type SendCodeResult =
  | { ok: true; providerMessageId?: string; method?: DeliveryMethod }
  | { ok: false; error: string; statusCode?: number };

export interface SmsProvider {
  readonly name: string;
  readonly isDemo: boolean;
  sendCode(phone: string, code: string, purpose: SmsPurpose): Promise<SendCodeResult>;
  // Phase 9: произвольный текст для уведомлений.
  sendText(phone: string, text: string): Promise<SendCodeResult>;
}

export type SmsPurpose = "client_login" | "vendor_login" | "courier_login" | "vendor_recovery";

export function buildSmsText(code: string, purpose: SmsPurpose): string {
  const intro =
    purpose === "vendor_recovery"
      ? "Код восстановления пароля ВкусМаркет"
      : purpose === "vendor_login"
        ? "Код входа в кабинет продавца ВкусМаркет"
        : purpose === "courier_login"
          ? "Код входа в кабинет курьера ВкусМаркет"
          : "Код входа в ВкусМаркет";
  return `${intro}: ${code}. Никому не передавайте.`;
}

export function normalizeRuPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `7${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("9")) {
    return `7${digits}`;
  }
  return null;
}
