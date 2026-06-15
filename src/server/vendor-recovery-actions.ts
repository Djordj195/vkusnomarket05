"use server";

import { sendOtp, verifyAndConsume } from "./sms-auth";
import { listVendors } from "./vendors-store";
import {
  getCredentialsByVendorId,
  updatePassword,
} from "./vendor-credentials-store";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
} from "./rate-limit";

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  return digits;
}

export type RecoverySendResult =
  | { ok: true; maskedPhone: string; demoCode: string | null }
  | { ok: false; error: string };

export async function sendVendorRecoveryCodeAction(
  formData: FormData
): Promise<RecoverySendResult> {
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return { ok: false, error: "Введите номер телефона." };

  const normalized = normalizePhone(phone);

  const rl = checkRateLimit(`vendor-recovery:${normalized}`);
  if (!rl.allowed) {
    return {
      ok: false,
      error: `Слишком много попыток. Попробуйте через ${rl.retryAfterSec} сек.`,
    };
  }

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

  const creds = await getCredentialsByVendorId(vendor.id);
  if (!creds) {
    return {
      ok: false,
      error: "Учётные данные не созданы. Сначала создайте логин и пароль.",
    };
  }

  const sent = await sendOtp(phone, "vendor_recovery");
  if (!sent.ok) {
    recordFailedAttempt(`vendor-recovery:${normalized}`);
    return { ok: false, error: sent.error };
  }

  const masked =
    phone.slice(0, 4) + "***" + phone.slice(-2);

  return { ok: true, maskedPhone: masked, demoCode: sent.demoCode };
}

export type RecoveryVerifyResult =
  | { ok: true }
  | { ok: false; error: string };

export async function resetVendorPasswordAction(
  formData: FormData
): Promise<RecoveryVerifyResult> {
  const phone = String(formData.get("phone") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!phone) return { ok: false, error: "Введите номер телефона." };
  if (!code) return { ok: false, error: "Введите код из SMS." };
  if (!newPassword) return { ok: false, error: "Введите новый пароль." };
  if (newPassword.length < 6) {
    return { ok: false, error: "Пароль должен быть не менее 6 символов." };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Пароли не совпадают." };
  }

  const normalized = normalizePhone(phone);

  const rl = checkRateLimit(`vendor-recovery-verify:${normalized}`);
  if (!rl.allowed) {
    return {
      ok: false,
      error: `Слишком много попыток. Попробуйте через ${rl.retryAfterSec} сек.`,
    };
  }

  const verified = await verifyAndConsume(phone, "vendor_recovery", code);
  if (!verified.ok) {
    recordFailedAttempt(`vendor-recovery-verify:${normalized}`);
    return { ok: false, error: verified.error };
  }

  const all = await listVendors();
  const vendor = all.find((v) => {
    const candidate = v.contacts?.phone
      ? normalizePhone(v.contacts.phone)
      : null;
    return candidate && candidate === normalized;
  });

  if (!vendor) {
    return { ok: false, error: "Продавец не найден." };
  }

  try {
    await updatePassword(vendor.id, newPassword);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Ошибка сброса пароля.";
    return { ok: false, error: msg };
  }

  resetAttempts(`vendor-recovery:${normalized}`);
  resetAttempts(`vendor-recovery-verify:${normalized}`);

  return { ok: true };
}
