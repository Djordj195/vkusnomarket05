"use server";

import { redirect } from "next/navigation";
import {
  COURIER_DEMO_CODE,
  clearCourierSession,
  normalizeCourierPhone,
  setCourierSession,
} from "./courier-auth";

export type CourierSendCodeResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendCourierCodeAction(
  formData: FormData
): Promise<CourierSendCodeResult> {
  const phone = String(formData.get("phone") ?? "");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return { ok: false, error: "Введите корректный номер телефона." };
  }
  // TODO: реальный вызов SMS-провайдера + создание/обновление courier в БД.
  return { ok: true };
}

export type CourierVerifyResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyCourierCodeAction(
  formData: FormData
): Promise<CourierVerifyResult> {
  const phone = String(formData.get("phone") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const courierType = (String(formData.get("courierType") ?? "platform") as
    | "platform"
    | "shop");

  if (code !== COURIER_DEMO_CODE) {
    return {
      ok: false,
      error: `Неверный код. В демо-режиме используйте ${COURIER_DEMO_CODE}.`,
    };
  }
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
