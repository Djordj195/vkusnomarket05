"use server";

import { redirect } from "next/navigation";
import {
  authenticateVendor,
  clearVendorSession,
  setVendorSession,
} from "./vendor-auth";
import { logConsent } from "./consent-store";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function vendorLoginAction(
  formData: FormData
): Promise<LoginResult> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!login) {
    return { ok: false, error: "Введите логин." };
  }
  if (!password) {
    return { ok: false, error: "Введите пароль." };
  }

  const result = await authenticateVendor(login, password);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await setVendorSession(result.vendor.id);

  logConsent({
    userPhone: result.vendor.contacts?.phone ?? login,
    context: "vendor_login",
    docSlugs: ["offer", "privacy", "consent"],
    checkboxText:
      "Продавец принимает оферту, политику конфиденциальности и согласие на обработку данных.",
  }).catch(() => {});

  return { ok: true };
}

export async function vendorLogoutAction(): Promise<void> {
  await clearVendorSession();
  redirect("/vendor/login");
}
