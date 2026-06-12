"use server";

import { listVendors } from "./vendors-store";
import {
  createCredentials,
  getCredentialsByVendorId,
  isLoginAvailable,
  updatePassword,
} from "./vendor-credentials-store";
import { isAdminAuthenticated } from "./admin-auth";
import { revalidatePath } from "next/cache";

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  return digits;
}

export type CreateCredentialsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createVendorCredentialsAction(
  formData: FormData
): Promise<CreateCredentialsResult> {
  const phone = String(formData.get("phone") ?? "").trim();
  const login = String(formData.get("login") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!phone) return { ok: false, error: "Введите номер телефона." };
  if (!login) return { ok: false, error: "Введите логин." };
  if (login.length < 3)
    return { ok: false, error: "Логин должен быть не менее 3 символов." };
  if (!/^[a-z0-9_.-]+$/.test(login))
    return {
      ok: false,
      error: "Логин может содержать только латинские буквы, цифры, точку, дефис и подчёркивание.",
    };
  if (!password) return { ok: false, error: "Введите пароль." };
  if (password.length < 6)
    return { ok: false, error: "Пароль должен быть не менее 6 символов." };
  if (password !== passwordConfirm)
    return { ok: false, error: "Пароли не совпадают." };

  const normalized = normalizePhone(phone);
  const all = await listVendors();
  const vendor = all.find((v) => {
    const candidate = v.contacts?.phone
      ? normalizePhone(v.contacts.phone)
      : null;
    return candidate && candidate === normalized;
  });

  if (!vendor) {
    return {
      ok: false,
      error: "Продавец с таким номером телефона не найден.",
    };
  }

  if (vendor.status !== "approved") {
    return {
      ok: false,
      error: "Ваша заявка ещё не одобрена администратором. Дождитесь одобрения.",
    };
  }

  const existing = await getCredentialsByVendorId(vendor.id);
  if (existing) {
    return {
      ok: false,
      error: "Учётные данные уже созданы. Используйте страницу входа.",
    };
  }

  const available = await isLoginAvailable(login);
  if (!available) {
    return { ok: false, error: "Этот логин уже занят. Выберите другой." };
  }

  try {
    await createCredentials(vendor.id, login, password);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Ошибка создания учётных данных.";
    return { ok: false, error: msg };
  }

  return { ok: true };
}

export type AdminResetPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function adminResetVendorPasswordAction(
  formData: FormData
): Promise<AdminResetPasswordResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён." };
  }
  const vendorId = String(formData.get("vendorId") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!vendorId) return { ok: false, error: "Не указан продавец." };
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: "Пароль должен быть не менее 6 символов." };
  }

  try {
    await updatePassword(vendorId, newPassword);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Ошибка сброса пароля.";
    return { ok: false, error: msg };
  }

  revalidatePath("/admin/vendors");
  return { ok: true };
}
