import "server-only";
import { cookies } from "next/headers";
import { signCookie, verifyCookie } from "./cookie-sign";

const COOKIE_NAME = "vkusnomarket_courier";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

/**
 * Демо-код для входа в курьерское приложение. После подключения SMS-провайдера
 * заменится на реальную одноразовую генерацию.
 */
export const COURIER_DEMO_CODE = "123456";

export type CourierSession = {
  /** Условный идентификатор курьера; в проде придёт из couriers таблицы. */
  id: string;
  /** Тип курьера */
  type: "platform" | "shop";
  /** Если type=shop — id привязанного продавца */
  vendorId?: string;
  /** Нормализованный телефон */
  phone: string;
};

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  return digits;
}

function encode(s: CourierSession): string {
  return JSON.stringify(s);
}

function decode(json: string): CourierSession | null {
  try {
    const parsed = JSON.parse(json) as CourierSession;
    if (!parsed.id || !parsed.type || !parsed.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setCourierSession(session: CourierSession): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, signCookie(encode(session)), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearCourierSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function getCurrentCourier(): Promise<CourierSession | null> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const payload = verifyCookie(raw);
  if (!payload) return null;
  return decode(payload);
}

export function normalizeCourierPhone(phone: string): string {
  return normalizePhone(phone);
}
