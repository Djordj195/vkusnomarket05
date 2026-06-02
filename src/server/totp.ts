import "server-only";

import { createHmac, randomBytes } from "crypto";

const DIGITS = 6;
const PERIOD = 30;

function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    result += alphabet[parseInt(chunk, 2)];
  }
  return result;
}

function base32Decode(encoded: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of encoded.toUpperCase()) {
    const idx = alphabet.indexOf(char);
    if (idx < 0) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateHOTP(secret: Buffer, counter: bigint): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(counter);
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return (code % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

export function generateTOTP(secret: string): string {
  const key = base32Decode(secret);
  const counter = BigInt(Math.floor(Date.now() / 1000 / PERIOD));
  return generateHOTP(key, counter);
}

export function verifyTOTP(secret: string, code: string): boolean {
  const key = base32Decode(secret);
  const now = BigInt(Math.floor(Date.now() / 1000 / PERIOD));
  for (let i = -1; i <= 1; i++) {
    if (generateHOTP(key, now + BigInt(i)) === code) return true;
  }
  return false;
}

export function otpauthURL(secret: string, label: string): string {
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent("ВкусноМаркет")}&digits=${DIGITS}&period=${PERIOD}`;
}
