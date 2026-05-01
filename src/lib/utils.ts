import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const norm = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  if (norm.length !== 11) return raw;
  return `+${norm[0]} (${norm.slice(1, 4)}) ${norm.slice(4, 7)}-${norm.slice(
    7,
    9
  )}-${norm.slice(9, 11)}`;
}

export function maskPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  const d = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  if (d.length === 0) return "";
  let out = "+7";
  if (d.length > 1) out += ` (${d.slice(1, 4)}`;
  if (d.length >= 4) out += `)`;
  if (d.length > 4) out += ` ${d.slice(4, 7)}`;
  if (d.length > 7) out += `-${d.slice(7, 9)}`;
  if (d.length > 9) out += `-${d.slice(9, 11)}`;
  return out;
}

export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${yy}${mm}${dd}-${rnd}`;
}
