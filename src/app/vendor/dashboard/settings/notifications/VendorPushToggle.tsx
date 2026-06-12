"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  subscribePushAction,
  unsubscribePushAction,
} from "@/server/notifications/notifications-actions";

type Props = {
  vendorId: string;
  vapidPublicKey: string | null;
};

type PushState = "loading" | "unsupported" | "denied" | "subscribed" | "idle";

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export function VendorPushToggle({ vendorId, vapidPublicKey }: Props) {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidPublicKey) {
      queueMicrotask(() => setState("unsupported"));
      return;
    }
    const perm = Notification.permission;
    if (perm === "denied") {
      queueMicrotask(() => setState("denied"));
      return;
    }
    let cancelled = false;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (!cancelled) setState(sub ? "subscribed" : "idle");
    });
    return () => { cancelled = true; };
  }, [vapidPublicKey]);

  function subscribe() {
    setError(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "denied") {
          setState("denied");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!),
        });
        const json = sub.toJSON();
        const res = await subscribePushAction({
          recipientType: "vendor",
          recipientId: vendorId,
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setState("subscribed");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка подписки");
      }
    });
  }

  function unsubscribe() {
    setError(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribePushAction({ endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
        setState("idle");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка отписки");
      }
    });
  }

  if (state === "loading") {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-4 animate-pulse">
        <div className="h-5 w-32 bg-ink-100 rounded" />
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
        <div className="flex items-center gap-2 text-[13px] text-ink-500">
          <BellOff size={16} />
          <span>Push-уведомления не поддерживаются в этом браузере</span>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-[13px] text-red-700">
          <BellOff size={16} />
          <span>
            Уведомления заблокированы. Разрешите их в настройках браузера.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {state === "subscribed" ? (
            <BellRing size={18} className="text-emerald-600" />
          ) : (
            <Bell size={18} className="text-ink-500" />
          )}
          <div>
            <div className="text-[13px] font-bold text-ink-900">
              Push-уведомления
            </div>
            <div className="text-[11px] text-ink-500">
              {state === "subscribed"
                ? "Включены — вы получаете уведомления о новых заказах"
                : "Получайте мгновенные уведомления о новых заказах"}
            </div>
          </div>
        </div>
      </div>
      {state === "subscribed" ? (
        <Button
          size="sm"
          fullWidth
          onClick={unsubscribe}
          disabled={pending}
          className="bg-ink-100 text-ink-700 hover:bg-ink-200"
        >
          {pending ? "Отключаем..." : "Отключить уведомления"}
        </Button>
      ) : (
        <Button size="sm" fullWidth onClick={subscribe} disabled={pending}>
          {pending ? "Подключаем..." : "Включить уведомления о заказах"}
        </Button>
      )}
      {error && (
        <p className="text-[12px] text-red-600">{error}</p>
      )}
    </div>
  );
}
