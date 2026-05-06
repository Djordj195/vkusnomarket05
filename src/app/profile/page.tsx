"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/auth";
import { useOrders } from "@/store/orders";
import { useFavorites } from "@/store/favorites";
import { formatPhone } from "@/lib/utils";
import {
  Heart,
  HelpCircle,
  LogOut,
  ShoppingBag,
  ChevronRight,
  Shield,
} from "lucide-react";

export default function ProfilePage() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const ordersCount = useOrders((s) => s.orders.length);
  const favCount = useFavorites((s) => s.ids.length);

  return (
    <PageShell>
      <Header variant="page" title="Профиль" showBack={false} />
      <div className="px-4 pt-2 pb-4 space-y-4">
        {user ? (
          <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-[18px] font-bold text-white">
              {(user.name?.[0] || user.phone[2] || "В").toUpperCase()}
            </div>
            <div className="flex-1 leading-tight">
              <div className="text-[15px] font-bold text-ink-900">
                {user.name || "Гость"}
              </div>
              <div className="mt-0.5 text-[13px] text-ink-600">
                {formatPhone(user.phone)}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-brand-50 p-4">
            <div className="text-[15px] font-bold text-ink-900">
              Войдите в аккаунт
            </div>
            <p className="mt-1 text-[13px] text-ink-600">
              Это позволит видеть историю заказов и сохранять адрес.
            </p>
            <Link href="/auth" className="mt-3 block">
              <Button fullWidth>Войти по номеру телефона</Button>
            </Link>
          </div>
        )}

        <ul className="overflow-hidden rounded-2xl border border-ink-200">
          <Item href="/orders" icon={<ShoppingBag size={20} />} title="Мои заказы" right={ordersCount.toString()} />
          <Item href="/favorites" icon={<Heart size={20} />} title="Избранное" right={favCount.toString()} />
          <Item href="/support" icon={<HelpCircle size={20} />} title="Поддержка" />
          <Item href="/admin/login" icon={<Shield size={20} />} title="Вход для администратора" />
        </ul>

        {user && (
          <Button
            variant="ghost"
            fullWidth
            onClick={() => logout()}
            className="text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Выйти
          </Button>
        )}
      </div>
    </PageShell>
  );
}

function Item({
  href,
  icon,
  title,
  right,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  right?: string;
}) {
  return (
    <li className="border-b border-ink-100 last:border-b-0">
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3.5 hover:bg-ink-50"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </span>
        <span className="flex-1 text-[14px] font-medium text-ink-900">
          {title}
        </span>
        {right && (
          <span className="text-[13px] text-ink-500">{right}</span>
        )}
        <ChevronRight size={18} className="text-ink-400" />
      </Link>
    </li>
  );
}
