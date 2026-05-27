import "server-only";
import type { SmsProvider, SendCodeResult, SmsPurpose } from "./types";
import { buildSmsText } from "./types";

// Demo-провайдер: ничего не отправляет, просто логирует.
// Используется когда не задан ни SMSC_LOGIN, ни SMSRU_API_ID.

export class DemoSmsProvider implements SmsProvider {
  readonly name = "demo";
  readonly isDemo = true;

  async sendCode(
    phone: string,
    code: string,
    purpose: SmsPurpose
  ): Promise<SendCodeResult> {
    const text = buildSmsText(code, purpose);
    console.info(
      `[sms:demo] would send to +${phone} (purpose=${purpose}): ${text}`
    );
    return { ok: true, providerMessageId: `demo-${Date.now()}` };
  }
}
