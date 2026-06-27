"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  MessageCircle,
  User,
  ShoppingBasket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useMounted } from "@/lib/use-mounted";

const items = [
  {
    href: "/market",
    label: "Главная",
    icon: Home,
    match: (p: string) =>
      p === "/market" ||
      p.startsWith("/market/catalog") ||
      p.startsWith("/market/category") ||
      p.startsWith("/market/product") ||
      p.startsWith("/market/search") ||
      p.startsWith("/market/shop") ||
      p.startsWith("/market/weekly") ||
      p.startsWith("/market/reviews") ||
      p.startsWith("/market/section"),
  },
  {
    href: "/market/cart",
    label: "Корзина",
    icon: ShoppingBasket,
    match: (p: string) =>
      p.startsWith("/market/cart") ||
      p.startsWith("/market/checkout") ||
      p.startsWith("/market/favorites"),
  },
  {
    href: "/market/orders",
    label: "Заказы",
    icon: ClipboardList,
    match: (p: string) => p.startsWith("/market/orders"),
  },
  {
    href: "/market/support",
    label: "Помощь",
    icon: MessageCircle,
    match: (p: string) => p.startsWith("/market/support"),
  },
  {
    href: "/market/profile",
    label: "Профиль",
    icon: User,
    match: (p: string) =>
      p.startsWith("/market/profile") ||
      p.startsWith("/market/auth") ||
      p.startsWith("/market/feedback"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const cartItems = useCart((s) => s.items);
  const hydrated = useCart((s) => s.hydrated);
  const mounted = useMounted();
  const cartCount = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems]
  );

  if (!pathname.startsWith("/market")) return null;

  return (
    <nav
      aria-label="Главная навигация"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-md md:max-w-2xl lg:max-w-5xl grid-cols-5">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          const showBadge =
            it.href === "/market/cart" && mounted && hydrated && cartCount > 0;
          return (
            <li key={it.href} className="flex">
              <Link
                href={it.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-brand-600" : "text-ink-400 hover:text-ink-700"
                )}
              >
                <span className="relative">
                  <Icon
                    size={24}
                    strokeWidth={active ? 2.4 : 1.8}
                    className={cn(active ? "text-brand-600" : "text-ink-500")}
                  />
                  {showBadge && (
                    <span className="absolute -right-2 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </span>
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
