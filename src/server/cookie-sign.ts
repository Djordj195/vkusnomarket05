import "server-only";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

/**
 * Signs and verifies cookie values using HMAC-SHA256.
 * Prevents session forgery — an attacker cannot craft a valid cookie
 * without knowing the server-side secret.
 *
 * The secret is derived from COOKIE_SECRET env var (recommended: 32+ chars).
 * Falls back to a deterministic derivation from ADMIN_PASSWORD + a fixed salt
 * so existing deployments continue to work until COOKIE_SECRET is set.
 */
function getSecret(): string {
  if (process.env.COOKIE_SECRET) return process.env.COOKIE_SECRET;
  const fallback = process.env.ADMIN_PASSWORD || "vkusno2025";
  return `vkm-cookie-${fallback}-salt-9f3a`;
}

export function signCookie(value: string): string {
  const sig = createHmac("sha256", getSecret())
    .update(value)
    .digest("hex");
  return `${value}.${sig}`;
}

export function verifyCookie(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac("sha256", getSecret())
    .update(value)
    .digest("hex");
  if (sig.length !== expected.length) return null;
  const sigBuf = Buffer.from(sig, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;
  return value;
}

export function generateCookieSecret(): string {
  return randomBytes(32).toString("hex");
}
