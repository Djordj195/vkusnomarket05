"use server";

import { redirect } from "next/navigation";
import {
  clearVendorSession,
  findVendorByPhone,
  setVendorSession,
} from "./vendor-auth";
import { sendOtp, verifyAndConsume } from "./sms-auth";

export type SendCodeResult =
  | { ok: true; brandName: string; demoCode: string | null }
  | { ok: false; error: string };

export async function sendVendorCodeAction(
  formData: FormData
): Promise<SendCodeResult> {
  const phone = String(formData.get("phone") ?? "");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return { ok: false, error: "Введите корректный номер телефона." };
  }
  const vendor = await findVendorByPhone(phone);
  if (!vendor) {
    return {
      ok: false,
      error:
        "Продавец с таким номером не найден. Если ещё не подавали заявку — оформите её на /vendor/signup.",
    };
  }
  if (vendor.status === "blocked") {
    return { ok: false, error: "Доступ заблокирован. Обратитесь в поддержку." };
  }
  if (vendor.status === "suspended") {
    return { ok: false, error: "Аккаунт приостановлен. Обратитесь в поддержку." };
  }

  const sent = await sendOtp(phone, "vendor_login");
  if (!sent.ok) return { ok: false, error: sent.error };
  return { ok: true, brandName: vendor.brandName, demoCode: sent.demoCode };
}

export type VerifyCodeResult = { ok: true } | { ok: false; error: string };

export async function verifyVendorCodeAction(
  formData: FormData
): Promise<VerifyCodeResult> {
  const phone = String(formData.get("phone") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const verified = await verifyAndConsume(phone, "vendor_login", code);
  if (!verified.ok) return { ok: false, error: verified.error };

  const vendor = await findVendorByPhone(phone);
  if (!vendor) {
    return { ok: false, error: "Сессия истекла. Попробуйте снова." };
  }
  await setVendorSession(vendor.id);
  return { ok: true };
}

export async function vendorLogoutAction(): Promise<void> {
  await clearVendorSession();
  redirect("/vendor/login");
}
