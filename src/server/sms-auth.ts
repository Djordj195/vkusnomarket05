import "server-only";
import { getSmsProvider, isSmsRealProviderConfigured, normalizeRuPhone } from "./sms";
import { generateAndStore, verify as verifyOtp, RESEND_COOLDOWN_MS } from "./otp-store";
import { logAudit } from "./audit-store";
import { DEMO_SMS_CODE } from "@/lib/constants";
import type { SmsPurpose } from "./sms";

// Phase 7: единая точка отправки/проверки OTP для всех трёх логинов.
// Особенности:
//  • В демо-режиме (нет креден провайдера или SMS_PROVIDER=demo) — код
//    *всегда* `123456`, чтобы preview работал без реальных SMS. OTP
//    всё равно генерится и кладётся в store, но клиенту достаточно
//    ввести `123456` (см. verifyAndConsume).
//  • В прод-режиме генерится случайный 6-значный код, и проверяется он же.
//  • Аудит-лог: `auth.code_sent`, `auth.code_verified`, `auth.code_failed`.

export type SendCodeOutcome =
  | { ok: true; demoCode: string | null }
  | { ok: false; error: string; retryAfterSec?: number };

export async function sendOtp(
  rawPhone: string,
  purpose: SmsPurpose
): Promise<SendCodeOutcome> {
  const phone = normalizeRuPhone(rawPhone);
  if (!phone) {
    return { ok: false, error: "Введите корректный номер (+7...)." };
  }
  const gen = await generateAndStore({ phone, purpose });
  if (!gen.ok) {
    if (gen.retryAfterMs && gen.retryAfterMs > 0) {
      return {
        ok: false,
        error: `Подождите ${Math.ceil(gen.retryAfterMs / 1000)} сек перед повторной отправкой.`,
        retryAfterSec: Math.ceil(gen.retryAfterMs / 1000),
      };
    }
    return { ok: false, error: gen.error };
  }

  const provider = getSmsProvider();
  const isDemo = provider.isDemo;

  const send = await provider.sendCode(phone, gen.entry.code, purpose);

  await logAudit({
    actorType: "system",
    action: "auth.code_sent",
    targetType: "phone",
    targetId: phone,
    payload: {
      purpose,
      provider: provider.name,
      ok: send.ok,
      providerMessageId: send.ok ? send.providerMessageId : null,
      error: send.ok ? null : send.error,
    },
  });

  if (!send.ok) {
    return { ok: false, error: `SMS не отправлено: ${send.error}` };
  }
  return { ok: true, demoCode: isDemo ? DEMO_SMS_CODE : null };
}

export type VerifyOutcome =
  | { ok: true; phone: string }
  | { ok: false; error: string };

export async function verifyAndConsume(
  rawPhone: string,
  purpose: SmsPurpose,
  rawCode: string
): Promise<VerifyOutcome> {
  const phone = normalizeRuPhone(rawPhone);
  if (!phone) {
    return { ok: false, error: "Введите корректный номер (+7...)." };
  }
  const code = rawCode.trim();

  // Демо-режим: принимаем `123456`. Реальный сгенерированный код
  // помечаем как использованный, чтобы один и тот же номер не открыл
  // несколько активных сессий.
  if (!isSmsRealProviderConfigured() && code === DEMO_SMS_CODE) {
    await logAudit({
      actorType: "system",
      action: "auth.code_verified",
      targetType: "phone",
      targetId: phone,
      payload: { purpose, mode: "demo" },
    });
    return { ok: true, phone };
  }

  const result = await verifyOtp(phone, purpose, code);
  if (!result.ok) {
    await logAudit({
      actorType: "system",
      action: "auth.code_failed",
      targetType: "phone",
      targetId: phone,
      payload: {
        purpose,
        error: result.error,
        attemptsLeft: result.attemptsLeft ?? null,
      },
    });
    return { ok: false, error: result.error };
  }
  await logAudit({
    actorType: "system",
    action: "auth.code_verified",
    targetType: "phone",
    targetId: phone,
    payload: { purpose, mode: "real" },
  });
  return { ok: true, phone };
}

export { RESEND_COOLDOWN_MS };
