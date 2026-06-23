import "server-only";
import webpush from "web-push";
import type { StoredPushSubscription } from "@/lib/types";

// VAPID keys генерируется одним из способов:
//   1) npx web-push generate-vapid-keys (рекомендуется, см. README)
//   2) через web-push.generateVAPIDKeys() в скрипте
//
// Если переменные VAPID не заданы — push отправляется в demo-режим
// (логирование в console), реальная отправка не производится.
//
// `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — публичный ключ, шлётся клиенту для
// service worker'а. Приватный остаётся на сервере.

export type VapidEnv = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export function readVapidEnv(): VapidEnv | null {
  const pub =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return null;
  return {
    publicKey: pub,
    privateKey: priv,
    subject:
      process.env.VAPID_SUBJECT ||
      `mailto:support@${process.env.NEXT_PUBLIC_SITE_URL ?? "vkusnomarket05.vercel.app"}`,
  };
}

export function isWebPushConfigured(): boolean {
  return readVapidEnv() !== null;
}

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
};

let vapidInitialized = false;
function ensureVapid(env: VapidEnv): void {
  if (vapidInitialized) return;
  webpush.setVapidDetails(env.subject, env.publicKey, env.privateKey);
  vapidInitialized = true;
}

export type WebPushResult =
  | { ok: true }
  | { ok: false; gone: boolean; error: string };

export async function sendWebPush(
  sub: StoredPushSubscription,
  payload: WebPushPayload
): Promise<WebPushResult> {
  const env = readVapidEnv();
  if (!env) {
    console.log("[push:demo]", sub.endpoint.slice(-32), payload);
    return { ok: true };
  }
  ensureVapid(env);
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (e) {
    const err = e as { statusCode?: number; body?: string; message?: string };
    const code = err.statusCode ?? 0;
    const gone = code === 404 || code === 410;
    return {
      ok: false,
      gone,
      error: err.body || err.message || `HTTP ${code}`,
    };
  }
}
