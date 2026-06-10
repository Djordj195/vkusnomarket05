"use client";

import { useEffect } from "react";

/**
 * Registers the main service worker on mount.
 * Renders nothing — just a side-effect component placed in the root layout.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("[SW] registration failed:", err));
    }
  }, []);
  return null;
}
