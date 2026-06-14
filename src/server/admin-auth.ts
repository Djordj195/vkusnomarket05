import "server-only";
import { cookies } from "next/headers";
import { ADMIN_DEFAULT_LOGIN, ADMIN_DEFAULT_PASSWORD } from "@/lib/constants";
import { signCookie, verifyCookie } from "./cookie-sign";

const COOKIE_NAME = "vkusnomarket_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || ADMIN_DEFAULT_LOGIN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ADMIN_DEFAULT_PASSWORD;

const SESSION_PAYLOAD = "admin:authenticated";

export async function login(
  login: string,
  password: string
): Promise<boolean> {
  if (login.trim() !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
    return false;
  }
  const c = await cookies();
  c.set(COOKIE_NAME, signCookie(SESSION_PAYLOAD), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return true;
}

export async function logout(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = verifyCookie(token);
  return payload === SESSION_PAYLOAD;
}
