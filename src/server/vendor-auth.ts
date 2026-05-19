import "server-only";
import { cookies } from "next/headers";
import { getVendorById, listVendors } from "./vendors-store";
import type { Vendor } from "@/lib/types";

const COOKIE_NAME = "vkusnomarket_vendor";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

/**
 * Demo-режим: пока не подключён реальный SMS-провайдер, код для входа в
 * кабинет продавца всегда `123456`. После интеграции SMS.ru/Tele2 здесь
 * будет таблица с одноразовыми кодами и срок жизни 5 минут.
 */
export const VENDOR_DEMO_CODE = "123456";

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  return digits;
}

export async function findVendorByPhone(
  phone: string
): Promise<Vendor | undefined> {
  const normalized = normalizePhone(phone);
  const all = await listVendors();
  return all.find((v) => {
    const candidate = v.contacts?.phone
      ? normalizePhone(v.contacts.phone)
      : null;
    return candidate && candidate === normalized;
  });
}

export async function setVendorSession(vendorId: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, vendorId, {
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
  const vendorId = c.get(COOKIE_NAME)?.value;
  if (!vendorId) return undefined;
  return getVendorById(vendorId);
}

export async function requireVendor(): Promise<Vendor> {
  const v = await getCurrentVendor();
  if (!v) {
    throw new Error("vendor session required");
  }
  return v;
}
