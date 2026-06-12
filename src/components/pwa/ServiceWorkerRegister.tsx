"use client";

import { useEffect } from "react";

/**
 * Registers the main service worker after the page fully loads.
 * Waiting for "load" prevents SW fetch from interfering with initial
 * page load on iOS Safari.
 * Renders nothing — just a side-effect component placed in the root layout.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    function register() {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("[SW] registration failed:", err));
    }

    // Wait for page to fully load before registering SW.
    // On iOS Safari, early registration can interfere with resource loading.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);
  return null;
}
