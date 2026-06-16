"use client";

import { useEffect } from "react";
import type { AppRole } from "@/lib/manifests";

type Props = {
  role: AppRole;
  themeColor: string;
  iconPrefix: string;
};

/**
 * Injects the correct manifest link and apple-touch-icon for sub-apps
 * (vendor, courier, admin). Overrides the root layout's manifest link.
 */
export function AppManifestHead({ role, themeColor, iconPrefix }: Props) {
  useEffect(() => {
    // Override manifest link
    let link = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]'
    );
    if (link) {
      link.href = `/api/manifest/${role}`;
    } else {
      link = document.createElement("link");
      link.rel = "manifest";
      link.href = `/api/manifest/${role}`;
      document.head.appendChild(link);
    }

    // Override theme-color
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    if (meta) {
      meta.content = themeColor;
    }

    // Override apple-touch-icon
    let appleIcon = document.querySelector<HTMLLinkElement>(
      'link[rel="apple-touch-icon"]'
    );
    if (appleIcon) {
      appleIcon.href = `/${iconPrefix}-apple.png`;
    } else {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      appleIcon.href = `/${iconPrefix}-apple.png`;
      document.head.appendChild(appleIcon);
    }
  }, [role, themeColor, iconPrefix]);

  return null;
}
