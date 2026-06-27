"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, BellOff, ChevronLeft, Loader2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/auth";
import {
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_EVENT_LABELS,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationPreference,
} from "@/lib/types";
import {
  getMyNotificationPreferencesAction,
  setNotificationPreferenceAction,
  subscribePushAction,
  unsubscribePushAction,
} from "@/server/notifications/notifications-actions";

const CLIENT_EVENTS: NotificationEvent[] = [
  "order.status",
  "payment.succeeded",
  "payment.refunded",
];

const CHANNELS: NotificationChannel[] = ["push", "email", "sms"];

function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i += 1) view[i] = rawData.charCodeAt(i);
  return buf;
}

type PushState =
  | { kind: "unsupported"; reason: string }
  | { kind: "unauth" }
  | { kind: "loading" }
  | { kind: "denied" }
  | { kind: "subscribed"; endpoint: string }
  | { kind: "unsubscribed" };

export function ProfileNotificationsView({
  vapidPublicKey,
}: {
  vapidPublicKey: string;
}) {
  const user = useAuth((s) => s.user);
  const [push, setPush] = useState<PushState>({ kind: "loading" });
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      if (!user) {
        setPush({ kind: "unauth" });
        return;
      }
      if (typeof window === "undefined") {
        setPush({ kind: "unsupported", reason: "SSR" });
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPush({
          kind: "unsupported",
          reason: "Браузер не поддерживает Web Push.",
        });
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setPush({ kind: "subscribed", endpoint: existing.endpoint });
        } else if (Notification.permission === "denied") {
          setPush({ kind: "denied" });
        } else {
          setPush({ kind: "unsubscribed" });
        }
      } catch (e) {
        setPush({
          kind: "unsupported",
          reason:
            e instanceof Error ? e.message : "Не удалось зарегистрировать SW.",
        });
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const list = await getMyNotificationPreferencesAction({
        recipientType: "client",
        recipientId: user.phone,
      });
      setPrefs(list);
    })();
  }, [user]);

  const enabled = useCallback(
    (channel: NotificationChannel, event: NotificationEvent): boolean => {
      const p = prefs.find((x) => x.channel === channel && x.event === event);
      if (!p) return true; // default opt-in
      return p.enabled;
    },
    [prefs]
  );

  const toggle = useCallback(
    (channel: NotificationChannel, event: NotificationEvent, next: boolean) => {
      if (!user) return;
      setPrefs((cur) => {
        const others = cur.filter(
          (x) => !(x.channel === channel && x.event === event)
        );
        return [
          ...others,
          {
            id: `pref-client-${user.phone}-${channel}-${event}`,
            recipientType: "client",
            recipientId: user.phone,
            channel,
            event,
            enabled: next,
            updatedAt: new Date().toISOString(),
          },
        ];
      });
      startTransition(async () => {
        await setNotificationPreferenceAction({
          recipientType: "client",
          recipientId: user.phone,
          channel,
          event,
          enabled: next,
        });
      });
    },
    [user]
  );

  const subscribe = useCallback(async () => {
    setError(null);
    if (!user || !vapidPublicKey) {
      setError(
        !vapidPublicKey
          ? "Не задан публичный VAPID-ключ — push отключён."
          : "Сначала войдите в аккаунт."
      );
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(vapidPublicKey),
      });
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      const res = await subscribePushAction({
        recipientType: "client",
        recipientId: user.phone,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPush({ kind: "subscribed", endpoint: json.endpoint });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось подписаться.");
    }
  }, [user, vapidPublicKey]);

  const unsubscribe = useCallback(async () => {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setPush({ kind: "unsubscribed" });
        return;
      }
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await unsubscribePushAction({ endpoint });
      setPush({ kind: "unsubscribed" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отписаться.");
    }
  }, []);

  const pushBanner = useMemo(() => {
    if (push.kind === "loading") return null;
    if (push.kind === "unauth") {
      return (
        <Banner
          title="Войдите, чтобы настроить уведомления"
          body="Push, email и SMS привязаны к вашему аккаунту."
          action={
            <Link href="/market/auth">
              <Button variant="primary" size="sm">
                Войти
              </Button>
            </Link>
          }
        />
      );
    }
    if (push.kind === "unsupported") {
      return (
        <Banner
          title="Push недоступен"
          body={push.reason}
          tone="warn"
        />
      );
    }
    if (push.kind === "denied") {
      return (
        <Banner
          title="Разрешение на уведомления отозвано"
          body="Откройте настройки сайта в браузере и разрешите уведомления."
          tone="warn"
        />
      );
    }
    if (push.kind === "subscribed") {
      return (
        <Banner
          title="Push-уведомления включены"
          body="Будем присылать обновления статусов, оплат и доставок."
          action={
            <Button variant="ghost" size="sm" onClick={unsubscribe}>
              <BellOff size={16} /> Отключить
            </Button>
          }
        />
      );
    }
    return (
      <Banner
        title="Включить push-уведомления"
        body="Будете моментально получать обновления статусов прямо в браузере."
        action={
          <Button variant="primary" size="sm" onClick={subscribe}>
            <Bell size={16} /> Подписаться
          </Button>
        }
      />
    );
  }, [push, subscribe, unsubscribe]);

  return (
    <PageShell className="bg-white">
      <div className="sticky top-0 z-10 pt-safe-top flex items-center gap-2 border-b border-ink-100 bg-white/80 px-3 py-2 backdrop-blur">
        <Link
          href="/market/profile"
          className="flex items-center gap-1 rounded-xl px-2 py-1 text-[14px] text-ink-700 hover:bg-ink-50"
        >
          <ChevronLeft size={18} /> Профиль
        </Link>
        <h1 className="ml-2 text-[16px] font-bold text-ink-900">Уведомления</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {pushBanner}

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
            {error}
          </p>
        )}

        {!vapidPublicKey && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            Demo-режим: переменная <code>NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> не
            задана. Push реально не отправляется. Сгенерируйте ключи командой{" "}
            <code>npx web-push generate-vapid-keys</code> и добавьте в env.
          </p>
        )}

        {user && (
          <section className="space-y-2">
            <h2 className="text-[14px] font-bold text-ink-900">
              Какие уведомления получать
            </h2>
            <div className="overflow-hidden rounded-2xl border border-ink-100">
              <table className="w-full text-[13px]">
                <thead className="bg-ink-50 text-[11px] uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Событие</th>
                    {CHANNELS.map((c) => (
                      <th key={c} className="px-3 py-2 text-center">
                        {NOTIFICATION_CHANNEL_LABELS[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CLIENT_EVENTS.map((event) => (
                    <tr
                      key={event}
                      className="border-t border-ink-100 last:border-b"
                    >
                      <td className="px-3 py-2 text-ink-900">
                        {NOTIFICATION_EVENT_LABELS[event]}
                      </td>
                      {CHANNELS.map((channel) => (
                        <td key={channel} className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={enabled(channel, event)}
                            onChange={(e) =>
                              toggle(channel, event, e.target.checked)
                            }
                            disabled={pending}
                            className="h-5 w-5 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-ink-500">
              По умолчанию все включены. Push приходит мгновенно, email и SMS —
              если у вас указаны эти контакты.
            </p>
            {pending && (
              <p className="flex items-center gap-1 text-[11px] text-ink-500">
                <Loader2 size={12} className="animate-spin" /> Сохраняю…
              </p>
            )}
          </section>
        )}

        <div className="h-6" />
      </div>
    </PageShell>
  );
}

function Banner({
  title,
  body,
  action,
  tone = "info",
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  tone?: "info" | "warn";
}) {
  const bg = tone === "warn" ? "bg-amber-50 border-amber-200" : "bg-brand-50 border-brand-200";
  return (
    <div className={`flex items-start justify-between gap-3 rounded-2xl border ${bg} p-3`}>
      <div className="min-w-0">
        <div className="text-[14px] font-bold text-ink-900">{title}</div>
        <div className="mt-0.5 text-[12px] text-ink-700">{body}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
