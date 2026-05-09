"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Tag,
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
    href: "/",
    label: "Главная",
    icon: Home,
    match: (p: string) =>
      p === "/" ||
      p.startsWith("/catalog") ||
      p.startsWith("/category") ||
      p.startsWith("/product") ||
      p.startsWith("/search") ||
      p.startsWith("/shop") ||
      p.startsWith("/weekly"),
  },
  {
    href: "/deals",
    label: "Скидки",
    icon: Tag,
    match: (p: string) => p.startsWith("/deals") || p.startsWith("/favorites"),
  },
  {
    href: "/orders",
    label: "Заказы",
    icon: ClipboardList,
    match: (p: string) => p.startsWith("/orders"),
  },
  {
    href: "/support",
    label: "Помощь",
    icon: MessageCircle,
    match: (p: string) => p.startsWith("/support"),
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: User,
    match: (p: string) => p.startsWith("/profile") || p.startsWith("/auth"),
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

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {mounted && hydrated && cartCount > 0 && !pathname.startsWith("/cart") && (
        <Link
          href="/cart"
          aria-label="Корзина"
          className="fixed right-4 z-40 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-white shadow-lg shadow-brand-600/40 hover:bg-brand-700"
          style={{
            bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <ShoppingBasket size={18} />
          <span className="text-[13px] font-bold">{cartCount}</span>
        </Link>
      )}

      <nav
        aria-label="Главная навигация"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-200 bg-white"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {items.map((it) => {
            const active = it.match(pathname);
            const Icon = it.icon;
            return (
              <li key={it.href} className="flex">
                <Link
                  href={it.href}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                    active ? "text-brand-600" : "text-ink-400 hover:text-ink-700"
                  )}
                >
                  <Icon
                    size={24}
                    strokeWidth={active ? 2.4 : 1.8}
                    className={cn(active ? "text-brand-600" : "text-ink-500")}
                  />
                  <span>{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
