"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, ShoppingBasket, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useMounted } from "@/lib/use-mounted";

const items = [
  { href: "/", label: "Каталог", icon: Home, match: (p: string) => p === "/" || p.startsWith("/catalog") || p.startsWith("/category") || p.startsWith("/product") || p.startsWith("/search") },
  { href: "/orders", label: "Заказы", icon: ClipboardList, match: (p: string) => p.startsWith("/orders") },
  { href: "/cart", label: "Корзина", icon: ShoppingBasket, match: (p: string) => p.startsWith("/cart") || p.startsWith("/checkout") },
  { href: "/profile", label: "Профиль", icon: User, match: (p: string) => p.startsWith("/profile") || p.startsWith("/auth") || p.startsWith("/favorites") || p.startsWith("/support") },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const items_ = useCart((s) => s.items);
  const hydrated = useCart((s) => s.hydrated);
  const mounted = useMounted();
  const count = useMemo(
    () => items_.reduce((sum, i) => sum + i.quantity, 0),
    [items_]
  );

  // Скрыть нижнее меню в админке
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Главная навигация"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          const isCart = it.href === "/cart";
          return (
            <li key={it.href} className="flex">
              <Link
                href={it.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-brand-600" : "text-ink-500 hover:text-ink-800"
                )}
              >
                <span className="relative inline-flex">
                  <Icon
                    size={24}
                    strokeWidth={active ? 2.4 : 2}
                    className={cn(active && "text-brand-600")}
                  />
                  {isCart && mounted && hydrated && count > 0 && (
                    <span className="absolute -top-1.5 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold leading-none text-white">
                      {count}
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
