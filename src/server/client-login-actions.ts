"use server";

import { sendOtp, verifyAndConsume } from "./sms-auth";

export type ClientSendResult =
  | { ok: true; demoCode: string | null }
  | { ok: false; error: string };

export async function sendClientCodeAction(
  formData: FormData
): Promise<ClientSendResult> {
  const phone = String(formData.get("phone") ?? "");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return { ok: false, error: "Введите корректный номер телефона." };
  }
  const sent = await sendOtp(phone, "client_login");
  if (!sent.ok) return { ok: false, error: sent.error };
  return { ok: true, demoCode: sent.demoCode };
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
  return { ok: true, phone: verified.phone };
}
