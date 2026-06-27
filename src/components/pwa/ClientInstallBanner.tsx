"use client";

import { usePathname } from "next/navigation";
import { AppInstallBanner } from "./AppInstallBanner";

export function ClientInstallBanner() {
  const pathname = usePathname() ?? "/";
  if (!pathname.startsWith("/market")) return null;
  return <AppInstallBanner appName="ВкусМаркет" themeColor="#6f46ff" />;
}
