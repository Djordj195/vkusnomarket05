"use server";

import { cookies } from "next/headers";
import { isAdminAuthenticated } from "./admin-auth";
import { generateSecret, verifyTOTP, otpauthURL } from "./totp";

const TOTP_COOKIE = "vkusnomarket_admin_totp";

// In-memory storage for TOTP secret (production: use DB/env)
const globalKey = "__VKUSNOMARKET_TOTP__";
type TOTPState = { secret: string | null; enabled: boolean };

function getState(): TOTPState {
  const g = globalThis as unknown as Record<string, TOTPState | undefined>;
  if (!g[globalKey]) g[globalKey] = { secret: null, enabled: false };
  return g[globalKey]!;
}

export async function get2FAStatus(): Promise<{
  enabled: boolean;
  verified: boolean;
}> {
  if (!(await isAdminAuthenticated())) return { enabled: false, verified: false };
  const state = getState();
  if (!state.enabled) return { enabled: false, verified: false };
  const c = await cookies();
  const verified = c.get(TOTP_COOKIE)?.value === "ok";
  return { enabled: true, verified };
}

export async function setup2FA(): Promise<{
  ok: boolean;
  secret?: string;
  otpauth?: string;
  error?: string;
}> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  const state = getState();
  const secret = generateSecret();
  state.secret = secret;
  state.enabled = false;
  const otp = otpauthURL(secret, "ВкусноМаркет Admin");
  return { ok: true, secret, otpauth: otp };
}

export async function confirm2FA(code: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  const state = getState();
  if (!state.secret) return { ok: false, error: "Сначала настройте 2FA" };
  if (!verifyTOTP(state.secret, code)) {
    return { ok: false, error: "Неверный код. Попробуйте ещё раз." };
  }
  state.enabled = true;
  const c = await cookies();
  c.set(TOTP_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}

export async function verify2FA(code: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  const state = getState();
  if (!state.enabled || !state.secret) return { ok: false, error: "2FA не настроена" };
  if (!verifyTOTP(state.secret, code)) {
    return { ok: false, error: "Неверный код" };
  }
  const c = await cookies();
  c.set(TOTP_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}

export async function disable2FA(code: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  const state = getState();
  if (!state.enabled || !state.secret) return { ok: false, error: "2FA не включена" };
  if (!verifyTOTP(state.secret, code)) {
    return { ok: false, error: "Неверный код" };
  }
  state.enabled = false;
  state.secret = null;
  const c = await cookies();
  c.delete(TOTP_COOKIE);
  return { ok: true };
}
