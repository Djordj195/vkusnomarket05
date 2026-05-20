"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, History, Map, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  match: (p: string) => boolean;
};

const items: Item[] = [
  {
    href: "/courier/dashboard",
    label: "Заказы",
    icon: Bike,
    match: (p) =>
      p === "/courier/dashboard" || p.startsWith("/courier/dashboard/orders"),
  },
  {
    href: "/courier/dashboard/map",
    label: "Карта",
    icon: Map,
    match: (p) => p.startsWith("/courier/dashboard/map"),
  },
  {
    href: "/courier/dashboard/history",
    label: "История",
    icon: History,
    match: (p) => p.startsWith("/courier/dashboard/history"),
  },
  {
    href: "/courier/dashboard/profile",
    label: "Профиль",
    icon: User,
    match: (p) =>
      p.startsWith("/courier/dashboard/profile") ||
      p.startsWith("/courier/dashboard/documents"),
  },
];

export function CourierBottomNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Курьерское приложение"
    >
      <ul className="mx-auto grid w-full max-w-3xl grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.match(pathname);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold",
                  active ? "text-brand-700" : "text-ink-500 hover:text-ink-900"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
