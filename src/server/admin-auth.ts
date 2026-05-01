import "server-only";
import { cookies } from "next/headers";
import { ADMIN_DEFAULT_LOGIN, ADMIN_DEFAULT_PASSWORD } from "@/lib/constants";

const COOKIE_NAME = "vkusnomarket_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || ADMIN_DEFAULT_LOGIN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ADMIN_DEFAULT_PASSWORD;

function tokenFor(login: string, password: string): string {
  // Простой токен, совмещающий логин и пароль для текущей сессии.
  // В продакшне рекомендуется заменить на JWT/проверку в БД.
  return Buffer.from(`${login}:${password}`).toString("base64");
}

const VALID_TOKEN = tokenFor(ADMIN_LOGIN, ADMIN_PASSWORD);

export async function login(
  login: string,
  password: string
): Promise<boolean> {
  if (login.trim() !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
    return false;
  }
  const c = await cookies();
  c.set(COOKIE_NAME, VALID_TOKEN, {
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
  return token === VALID_TOKEN;
}
