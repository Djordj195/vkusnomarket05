"use server";

import { cookies } from "next/headers";
import { sendOtp, verifyAndConsume } from "./sms-auth";

const ADMIN_PHONE =
  process.env.ADMIN_RECOVERY_PHONE ||
  process.env.ADMIN_PHONE ||
  "+79375021100";

const COOKIE_NAME = "vkusnomarket_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getAdminToken(): string {
  const login = process.env.ADMIN_LOGIN || "admin";
  const password = process.env.ADMIN_PASSWORD || "vkusno2025";
  return Buffer.from(`${login}:${password}`).toString("base64");
}

export type RecoverySendResult =
  | { ok: true; maskedPhone: string; demoCode: string | null }
  | { ok: false; error: string };

export async function sendAdminRecoveryCode(
  formData: FormData
): Promise<RecoverySendResult> {
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const adminDigits = ADMIN_PHONE.replace(/\D/g, "");
  if (phone !== adminDigits) {
    return {
      ok: false,
      error: "Этот номер не связан с аккаунтом администратора.",
    };
  }

  const sent = await sendOtp(ADMIN_PHONE, "client_login");
  if (!sent.ok) return { ok: false, error: sent.error };

  const masked =
    ADMIN_PHONE.slice(0, 4) +
    "***" +
    ADMIN_PHONE.slice(-4);

  return { ok: true, maskedPhone: masked, demoCode: sent.demoCode };
}

export type RecoveryVerifyResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyAdminRecoveryCode(
  formData: FormData
): Promise<RecoveryVerifyResult> {
  const code = String(formData.get("code") ?? "").trim();
  const verified = await verifyAndConsume(ADMIN_PHONE, "client_login", code);
  if (!verified.ok) return { ok: false, error: verified.error };

  const c = await cookies();
  c.set(COOKIE_NAME, getAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return { ok: true };
}
