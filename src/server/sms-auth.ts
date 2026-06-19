import "server-only";
import { after } from "next/server";
import { getSmsProvider, isSmsRealProviderConfigured, normalizeRuPhone } from "./sms";
import { generateAndStore, verify as verifyOtp, consumeEntry, RESEND_COOLDOWN_MS } from "./otp-store";
import { logAudit } from "./audit-store";
import { DEMO_SMS_CODE } from "@/lib/constants";
import type { SmsPurpose } from "./sms";

// OTP flow — единая точка отправки/проверки OTP для всех логинов.
//
// Ключевое улучшение: отправка SMS происходит через `after()` — пользователь
// НЕ ждёт ответа от SMS-провайдера. OTP генерируется и сохраняется мгновенно,
// ответ возвращается клиенту сразу, а SMS отправляется в фоне.

export type SendCodeOutcome =
  | { ok: true; demoCode: string | null; cooldownSec: number }
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
  const cooldownSec = Math.ceil(RESEND_COOLDOWN_MS / 1000);

  if (isDemo) {
    logAudit({
      actorType: "system",
      action: "auth.code_sent",
      targetType: "phone",
      targetId: phone,
      payload: { purpose, provider: "demo", ok: true },
    }).catch(() => {});
    return { ok: true, demoCode: DEMO_SMS_CODE, cooldownSec };
  }

  // Non-blocking: SMS отправляется в фоне через after().
  // Пользователь сразу видит "код отправлен" и может вводить код.
  const code = gen.code;
  const entryId = gen.entryId;

  after(async () => {
    try {
      console.info(`[otp] background send to ${phone.slice(0, 4)}**** purpose=${purpose}`);
      const send = await provider.sendCode(phone, code, purpose);

      logAudit({
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
      }).catch(() => {});

      if (!send.ok) {
        console.error(`[otp] SMS send failed for ${phone.slice(0, 4)}****: ${send.error}`);
        // Invalidate OTP so user can retry immediately
        await consumeEntry(entryId);
      }
    } catch (e) {
      console.error("[otp] background send exception:", e);
      await consumeEntry(entryId).catch(() => {});
    }
  });

  return { ok: true, demoCode: null, cooldownSec };
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

  // Демо-режим: принимаем `123456`
  if (!isSmsRealProviderConfigured() && code === DEMO_SMS_CODE) {
    logAudit({
      actorType: "system",
      action: "auth.code_verified",
      targetType: "phone",
      targetId: phone,
      payload: { purpose, mode: "demo" },
    }).catch(() => {});
    return { ok: true, phone };
  }

  const result = await verifyOtp(phone, purpose, code);
  if (!result.ok) {
    logAudit({
      actorType: "system",
      action: "auth.code_failed",
      targetType: "phone",
      targetId: phone,
      payload: {
        purpose,
        error: result.error,
        attemptsLeft: result.attemptsLeft ?? null,
      },
    }).catch(() => {});
    return { ok: false, error: result.error };
  }
  logAudit({
    actorType: "system",
    action: "auth.code_verified",
    targetType: "phone",
    targetId: phone,
    payload: { purpose, mode: "real" },
  }).catch(() => {});
  return { ok: true, phone };
}

export { RESEND_COOLDOWN_MS };
