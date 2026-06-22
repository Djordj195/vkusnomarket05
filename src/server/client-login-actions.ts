"use server";

import { sendOtp, verifyAndConsume } from "./sms-auth";
import { logConsent } from "./consent-store";
import type { DeliveryMethod } from "./sms";

export type ClientSendResult =
  | { ok: true; demoCode: string | null; cooldownSec: number; method: DeliveryMethod | "demo" }
  | { ok: false; error: string; retryAfterSec?: number };

export async function sendClientCodeAction(
  formData: FormData
): Promise<ClientSendResult> {
  const phone = String(formData.get("phone") ?? "");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return { ok: false, error: "Введите корректный номер телефона." };
  }
  const sent = await sendOtp(phone, "client_login");
  if (!sent.ok) return { ok: false, error: sent.error, retryAfterSec: sent.retryAfterSec };
  return { ok: true, demoCode: sent.demoCode, cooldownSec: sent.cooldownSec, method: sent.method };
}

export type ClientVerifyResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

export async function verifyClientCodeAction(
  formData: FormData
): Promise<ClientVerifyResult> {
  const phone = String(formData.get("phone") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const verified = await verifyAndConsume(phone, "client_login", code);
  if (!verified.ok) return { ok: false, error: verified.error };

  logConsent({
    userPhone: verified.phone,
    context: "client_login",
    docSlugs: ["offer", "privacy", "consent"],
    checkboxText:
      "Я принимаю оферту, политику конфиденциальности и согласие на обработку персональных данных.",
  }).catch(() => {});

  return { ok: true, phone: verified.phone };
}
