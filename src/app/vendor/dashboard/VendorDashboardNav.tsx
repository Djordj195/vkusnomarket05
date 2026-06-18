"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  ClipboardList,
  Truck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  match: (p: string) => boolean;
};

const items: Item[] = [
  {
    href: "/vendor/dashboard",
    label: "Обзор",
    icon: Home,
    match: (p) => p === "/vendor/dashboard",
  },
  {
    href: "/vendor/dashboard/catalog",
    label: "Каталог",
    icon: Package,
    match: (p) => p.startsWith("/vendor/dashboard/catalog"),
  },
  {
    href: "/vendor/dashboard/orders",
    label: "Заказы",
    icon: ClipboardList,
    match: (p) => p.startsWith("/vendor/dashboard/orders"),
  },
  {
    href: "/vendor/dashboard/couriers",
    label: "Курьеры",
    icon: Truck,
    match: (p) => p.startsWith("/vendor/dashboard/couriers"),
  },
  {
    href: "/vendor/dashboard/settings",
    label: "Ещё",
    icon: Settings,
    match: (p) =>
      p.startsWith("/vendor/dashboard/settings") ||
      p.startsWith("/vendor/dashboard/storefront") ||
      p.startsWith("/vendor/dashboard/reviews") ||
      p.startsWith("/vendor/dashboard/finances") ||
      p.startsWith("/vendor/dashboard/staff"),
  },
];

export function VendorDashboardNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Кабинет продавца"
    >
      <ul className="mx-auto grid w-full max-w-3xl lg:max-w-5xl grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.match(pathname);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold",
                  active ? "text-brand-700" : "text-ink-500 hover:text-ink-900"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
