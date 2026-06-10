"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

/**
 * Shows a prompt to iOS Safari users explaining how to install the PWA.
 * Only appears if:
 *  - device is iOS (iPhone/iPad)
 *  - browser is Safari (not in-app browsers)
 *  - app is NOT already in standalone mode
 *  - user hasn't dismissed it before
 */
export function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as unknown as { standalone?: boolean }).standalone) return;

    // Check if iOS Safari
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);

    if (!isIOS || !isSafari) return;

    // Check if dismissed
    const dismissed = localStorage.getItem("pwa-ios-prompt-dismissed");
    if (dismissed) return;

    // Show after short delay
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem("pwa-ios-prompt-dismissed", "1");
    setShow(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-[9999] mx-auto max-w-md px-4 animate-in slide-in-from-bottom-4">
      <div className="relative rounded-2xl bg-white p-4 shadow-xl ring-1 ring-ink-100">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 text-ink-400 hover:text-ink-700"
          aria-label="Закрыть"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
            <Share size={20} className="text-brand-600" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-ink-900">
              Установите приложение
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-600">
              Нажмите{" "}
              <span className="inline-flex items-center gap-0.5 rounded bg-ink-100 px-1 py-0.5 font-medium">
                <Share size={12} />
              </span>{" "}
              внизу экрана, затем{" "}
              <strong>«На экран Домой»</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
