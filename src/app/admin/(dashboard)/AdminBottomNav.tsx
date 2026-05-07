"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  Package,
  Sparkles,
  Store,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  match: (pathname: string) => boolean;
};

const items: Item[] = [
  {
    href: "/admin",
    label: "Обзор",
    icon: Home,
    match: (p) => p === "/admin",
  },
  {
    href: "/admin/orders",
    label: "Заказы",
    icon: ClipboardList,
    match: (p) => p.startsWith("/admin/orders"),
  },
  {
    href: "/admin/products",
    label: "Товары",
    icon: Package,
    match: (p) => p.startsWith("/admin/products"),
  },
  {
    href: "/admin/weekly",
    label: "Недели",
    icon: Sparkles,
    match: (p) => p.startsWith("/admin/weekly"),
  },
  {
    href: "/admin/categories",
    label: "Категории",
    icon: Tag,
    match: (p) => p.startsWith("/admin/categories"),
  },
  {
    href: "/admin/shops",
    label: "Магазины",
    icon: Store,
    match: (p) => p.startsWith("/admin/shops"),
  },
  {
    href: "/admin/couriers",
    label: "Курьеры",
    icon: Truck,
    match: (p) => p.startsWith("/admin/couriers"),
  },
  {
    href: "/admin/users",
    label: "Клиенты",
    icon: Users,
    match: (p) => p.startsWith("/admin/users"),
  },
];

export function AdminBottomNav() {
  const pathname = usePathname() ?? "/admin";

  return (
    <nav
      aria-label="Навигация админки"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-3xl">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.href} className="flex-1 min-w-0">
              <Link
                href={it.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold leading-tight transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-800"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                <span className="w-full truncate text-center">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
