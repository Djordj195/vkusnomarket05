"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Props = {
  appName: string;
  themeColor: string;
};

const subscribe = () => () => {};

export function AppInstallBanner({ appName, themeColor }: Props) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const isStandalone = useSyncExternalStore(
    subscribe,
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Record<string, unknown>).standalone === true),
    () => false
  );

  const isIOS = useSyncExternalStore(
    subscribe,
    () => /iPad|iPhone|iPod/.test(navigator.userAgent),
    () => false
  );

  // Listen for beforeinstallprompt using useSyncExternalStore pattern
  useSyncExternalStore(
    useCallback((notify) => {
      function onBeforeInstall(e: Event) {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        notify();
      }
      window.addEventListener("beforeinstallprompt", onBeforeInstall);
      return () =>
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    }, []),
    () => deferredPrompt,
    () => null
  );

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDismissed(true);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (isStandalone || dismissed) return null;

  // iOS doesn't support beforeinstallprompt
  if (isIOS) {
    return (
      <div className="mx-4 mt-3 rounded-2xl border border-ink-200 bg-white p-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: themeColor }}
          >
            <Download size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink-900">
              Установите {appName}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-500">
              Нажмите{" "}
              <span className="inline-block rounded bg-ink-100 px-1 text-[10px] font-bold">
                ⎙
              </span>{" "}
              → «На экран Домой»
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-ink-400 hover:text-ink-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <div className="mx-4 mt-3 rounded-2xl border border-ink-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: themeColor }}
        >
          <Download size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-ink-900">
            Установите {appName}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-500">
            На рабочий стол для быстрого доступа
          </p>
        </div>
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-bold text-white"
          style={{ backgroundColor: themeColor }}
        >
          Установить
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-ink-400 hover:text-ink-600"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
