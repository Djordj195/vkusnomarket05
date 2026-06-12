"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, X } from "lucide-react";
import { subscribePushAction } from "@/server/notifications/notifications-actions";

type Props = {
  vendorId: string;
  vapidPublicKey: string | null;
};

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export function VendorPushBanner({ vendorId, vapidPublicKey }: Props) {
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !vapidPublicKey
    ) return;
    if (Notification.permission !== "default") return;
    // Show banner only if not subscribed
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (!sub) setShow(true);
    });
  }, [vapidPublicKey]);

  function enable() {
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setShow(false);
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!),
        });
        const json = sub.toJSON();
        await subscribePushAction({
          recipientType: "vendor",
          recipientId: vendorId,
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        });
        setShow(false);
      } catch {
        setShow(false);
      }
    });
  }

  if (!show) return null;

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <Bell size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-brand-900">
          Включите уведомления
        </div>
        <div className="text-[11px] text-brand-700">
          Узнавайте о новых заказах мгновенно
        </div>
      </div>
      <button
        onClick={enable}
        disabled={pending}
        className="shrink-0 rounded-lg bg-brand-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
      >
        {pending ? "..." : "Включить"}
      </button>
      <button
        onClick={() => setShow(false)}
        className="shrink-0 p-1 text-ink-400 hover:text-ink-700"
      >
        <X size={16} />
      </button>
    </div>
  );
}
