import "server-only";
import { cookies } from "next/headers";
import { getVendorById } from "./vendors-store";
import {
  getCredentialsByLogin,
  verifyPassword,
} from "./vendor-credentials-store";
import { signCookie, verifyCookie } from "./cookie-sign";
import type { Vendor } from "@/lib/types";

const COOKIE_NAME = "vkusnomarket_vendor";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

export async function authenticateVendor(
  login: string,
  password: string
): Promise<
  | { ok: true; vendor: Vendor }
  | { ok: false; error: string }
> {
  const creds = await getCredentialsByLogin(login);
  if (!creds) {
    return { ok: false, error: "Неверный логин или пароль." };
  }
  const valid = await verifyPassword(password, creds.passwordHash);
  if (!valid) {
    return { ok: false, error: "Неверный логин или пароль." };
  }
  const vendor = await getVendorById(creds.vendorId);
  if (!vendor) {
    return { ok: false, error: "Продавец не найден." };
  }
  if (vendor.status === "blocked") {
    return { ok: false, error: "Доступ заблокирован. Обратитесь в поддержку." };
  }
  if (vendor.status === "suspended") {
    return { ok: false, error: "Аккаунт приостановлен. Обратитесь в поддержку." };
  }
  if (vendor.status !== "approved") {
    return { ok: false, error: "Аккаунт ещё не одобрен администратором." };
  }
  return { ok: true, vendor };
}

export async function setVendorSession(vendorId: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, signCookie(`vendor:${vendorId}`), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearVendorSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function getCurrentVendor(): Promise<Vendor | undefined> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return undefined;
  const payload = verifyCookie(raw);
  if (!payload || !payload.startsWith("vendor:")) return undefined;
  const vendorId = payload.slice("vendor:".length);
  return getVendorById(vendorId);
}

export async function requireVendor(): Promise<Vendor> {
  const v = await getCurrentVendor();
  if (!v) {
    throw new Error("vendor session required");
  }
  return v;
}
