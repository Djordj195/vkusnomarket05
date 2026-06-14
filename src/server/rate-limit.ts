import "server-only";

/**
 * Simple in-memory rate limiter for login endpoints.
 * Tracks failed attempts per key (e.g. IP or login) and blocks after threshold.
 *
 * Note: in a multi-instance deployment each process has its own store,
 * so this is a best-effort guard. For stricter enforcement, use Redis/DB.
 */

type Entry = { count: number; firstAttempt: number; blockedUntil: number };

const store = new Map<string, Entry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const BLOCK_MS = 15 * 60 * 1000; // 15 min block after exceeding

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.firstAttempt > WINDOW_MS + BLOCK_MS) {
      store.delete(key);
    }
  }
}, 60 * 1000);

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) return { allowed: true };

  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    store.delete(key);
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
    return {
      allowed: false,
      retryAfterSec: Math.ceil(BLOCK_MS / 1000),
    };
  }

  return { allowed: true };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    store.set(key, { count: 1, firstAttempt: now, blockedUntil: 0 });
    return;
  }
  entry.count++;
}

export function resetAttempts(key: string): void {
  store.delete(key);
}
