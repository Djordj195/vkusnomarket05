"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
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
  User as UserIcon,
  FileText,
  MessageSquare,
} from "lucide-react";

export default function ProfilePage() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const ordersCount = useOrders((s) => s.orders.length);
  const favCount = useFavorites((s) => s.ids.length);

  return (
    <PageShell className="bg-white">
      <div className="px-4 pt-3">
        <div className="flex items-center justify-center">
          <BrandPill />
        </div>
      </div>

      <div className="px-4 pt-8 pb-2 flex flex-col items-center text-center">
        {user ? (
          <>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-500 text-[34px] font-extrabold text-white">
              {(user.name?.[0] || user.phone[2] || "В").toUpperCase()}
            </div>
            <h1 className="mt-4 text-[24px] font-extrabold text-ink-900">
              {user.name || "Гость"}
            </h1>
            <p className="mt-1 text-[14px] text-ink-500">
              {formatPhone(user.phone)}
            </p>
          </>
        ) : (
          <>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-ink-100 text-ink-400">
              <UserIcon size={40} strokeWidth={1.6} />
            </div>
            <h1 className="mt-4 text-[24px] font-extrabold text-ink-900">
              Войдите в профиль
            </h1>
            <p className="mt-2 max-w-[280px] text-[14px] text-ink-500">
              Чтобы получить доступ ко всем функциям приложения
            </p>
            <Link href="/auth" className="mt-5 block w-full">
              <Button fullWidth size="lg">
                Войти или зарегистрироваться
              </Button>
            </Link>
          </>
        )}
      </div>

      <div className="px-4 pt-6">
        <h2 className="text-[24px] font-extrabold text-ink-900">Ещё</h2>
        <ul className="mt-3 overflow-hidden rounded-3xl bg-ink-100">
          <Item
            href="/orders"
            icon={<ShoppingBag size={20} />}
            title="Мои заказы"
            right={ordersCount > 0 ? ordersCount.toString() : undefined}
          />
          <Item
            href="/favorites"
            icon={<Heart size={20} />}
            title="Избранное"
            right={favCount > 0 ? favCount.toString() : undefined}
          />
          <Item
            href="/support"
            icon={<HelpCircle size={20} />}
            title="Поддержка"
          />
          <Item
            href="/faq"
            icon={<HelpCircle size={20} />}
            title="Частые вопросы"
          />
          <Item
            href="/feedback"
            icon={<MessageSquare size={20} />}
            title="Отзывы и предложения"
          />
          <Item
            href="/legal"
            icon={<FileText size={20} />}
            title="Юридическая информация"
          />
        </ul>
      </div>

      {user && (
        <div className="px-4 pt-4">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => logout()}
            className="text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Выйти
          </Button>
        </div>
      )}

      <div className="h-6" />
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
    <li className="border-b border-white/60 last:border-b-0">
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/40"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink-700 shadow-sm">
          {icon}
        </span>
        <span className="flex-1 text-[15px] font-medium text-ink-900">
          {title}
        </span>
        {right && <span className="text-[13px] text-ink-500">{right}</span>}
        <ChevronRight size={18} className="text-ink-400" />
      </Link>
    </li>
  );
}
