"use server";

import { redirect } from "next/navigation";
import {
  VENDOR_DEMO_CODE,
  clearVendorSession,
  findVendorByPhone,
  setVendorSession,
} from "./vendor-auth";

export type SendCodeResult =
  | { ok: true; brandName: string }
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
    return {
      ok: false,
      error: "Доступ заблокирован. Обратитесь в поддержку.",
    };
  }
  if (vendor.status === "suspended") {
    return {
      ok: false,
      error: "Аккаунт приостановлен. Обратитесь в поддержку.",
    };
  }
  // TODO: вызов SMS-провайдера. Пока — демо-режим, код фиксированный.
  return { ok: true, brandName: vendor.brandName };
}

export type VerifyCodeResult = { ok: true } | { ok: false; error: string };

export async function verifyVendorCodeAction(
  formData: FormData
): Promise<VerifyCodeResult> {
  const phone = String(formData.get("phone") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (code !== VENDOR_DEMO_CODE) {
    return {
      ok: false,
      error: `Неверный код. В демо-режиме используйте ${VENDOR_DEMO_CODE}.`,
    };
  }
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
