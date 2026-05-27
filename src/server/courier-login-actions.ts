"use server";

import { redirect } from "next/navigation";
import {
  clearCourierSession,
  normalizeCourierPhone,
  setCourierSession,
} from "./courier-auth";
import { sendOtp, verifyAndConsume } from "./sms-auth";

export type CourierSendCodeResult =
  | { ok: true; demoCode: string | null }
  | { ok: false; error: string };

export async function sendCourierCodeAction(
  formData: FormData
): Promise<CourierSendCodeResult> {
  const phone = String(formData.get("phone") ?? "");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return { ok: false, error: "Введите корректный номер телефона." };
  }
  const sent = await sendOtp(phone, "courier_login");
  if (!sent.ok) return { ok: false, error: sent.error };
  return { ok: true, demoCode: sent.demoCode };
}

export type CourierVerifyResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyCourierCodeAction(
  formData: FormData
): Promise<CourierVerifyResult> {
  const phone = String(formData.get("phone") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const courierType = String(formData.get("courierType") ?? "platform") as
    | "platform"
    | "shop";

  const verified = await verifyAndConsume(phone, "courier_login", code);
  if (!verified.ok) return { ok: false, error: verified.error };

  const normalized = normalizeCourierPhone(phone);
  if (!normalized) {
    return { ok: false, error: "Сессия истекла. Попробуйте снова." };
  }
  await setCourierSession({
    id: `crr-${normalized}`,
    type: courierType,
    phone: normalized,
  });
  return { ok: true };
}

export async function courierLogoutAction(): Promise<void> {
  await clearCourierSession();
  redirect("/courier/login");
}
