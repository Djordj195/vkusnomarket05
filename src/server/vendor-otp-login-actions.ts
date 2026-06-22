"use server";

import { sendOtp, verifyAndConsume } from "./sms-auth";
import { setVendorSession } from "./vendor-auth";
import { getVendorByContactPhone } from "./vendors-store";
import { logConsent } from "./consent-store";
import type { DeliveryMethod } from "./sms";

export type VendorOtpSendResult =
  | { ok: true; demoCode: string | null; cooldownSec: number; method: DeliveryMethod | "demo" }
  | { ok: false; error: string; retryAfterSec?: number };

export async function sendVendorOtpAction(
  formData: FormData
): Promise<VendorOtpSendResult> {
  const phone = String(formData.get("phone") ?? "");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return { ok: false, error: "Введите корректный номер телефона." };
  }

  // Check if vendor exists with this phone before sending OTP
  const vendor = await getVendorByContactPhone(digits);
  if (!vendor) {
    return { ok: false, error: "Продавец с таким номером не найден. Сначала подайте заявку." };
  }
  if (vendor.status === "pending" || vendor.status === "draft") {
    return { ok: false, error: "Ваша заявка ещё на модерации. Дождитесь одобрения администратором." };
  }
  if (vendor.status === "blocked") {
    return { ok: false, error: "Доступ заблокирован. Обратитесь в поддержку." };
  }
  if (vendor.status === "suspended") {
    return { ok: false, error: "Аккаунт приостановлен. Обратитесь в поддержку." };
  }

  const sent = await sendOtp(phone, "vendor_login");
  if (!sent.ok) return { ok: false, error: sent.error, retryAfterSec: sent.retryAfterSec };
  return { ok: true, demoCode: sent.demoCode, cooldownSec: sent.cooldownSec, method: sent.method };
}

export type VendorOtpVerifyResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyVendorOtpAction(
  formData: FormData
): Promise<VendorOtpVerifyResult> {
  const phone = String(formData.get("phone") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  const verified = await verifyAndConsume(phone, "vendor_login", code);
  if (!verified.ok) return { ok: false, error: verified.error };

  const digits = phone.replace(/\D/g, "");
  const vendor = await getVendorByContactPhone(digits);
  if (!vendor) {
    return { ok: false, error: "Продавец с таким номером не найден." };
  }
  if (vendor.status !== "approved") {
    return { ok: false, error: "Аккаунт ещё не одобрен администратором." };
  }

  await setVendorSession(vendor.id);

  logConsent({
    userPhone: digits,
    context: "vendor_login",
    docSlugs: ["offer", "privacy", "consent"],
    checkboxText:
      "Продавец принимает оферту, политику конфиденциальности и согласие на обработку данных.",
  }).catch(() => {});

  return { ok: true };
}
