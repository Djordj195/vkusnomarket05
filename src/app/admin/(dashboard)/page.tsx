import Link from "next/link";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  Package,
  Tag,
  Truck,
  Users,
  Wallet,
  Store,
} from "lucide-react";
import { listOrders } from "@/server/orders-store";
import { listCouriers } from "@/server/couriers-store";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export default async function AdminDashboardPage() {
  const orders = await listOrders();
  const couriers = await listCouriers();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).getTime() >= todayStart.getTime()
  );
  const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const activeOrders = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );
  const activeCouriers = couriers.filter((c) => c.isActive).length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Обзор</h1>
        <p className="text-[13px] text-ink-500">
          Сводка по заказам и каталогу.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Заказы сегодня"
          value={todayOrders.length.toString()}
          tone="brand"
        />
        <StatCard
          icon={<Wallet size={18} />}
          label="Выручка сегодня"
          value={formatPrice(revenue)}
          tone="accent"
        />
        <StatCard
          icon={<Bell size={18} />}
          label="Активные"
          value={activeOrders.length.toString()}
          tone="amber"
        />
        <StatCard
          icon={<Truck size={18} />}
          label="Курьеры"
          value={`${activeCouriers} / ${couriers.length}`}
          tone="sky"
        />
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink-900">
            Последние заказы
          </h2>
          <Link
            href="/admin/orders"
            className="text-[12px] font-semibold text-brand-600"
          >
            Все →
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="rounded-xl bg-ink-50 px-3 py-4 text-center text-[13px] text-ink-500">
            Заказов пока нет
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2.5 hover:bg-ink-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-ink-900">
                      № {o.number}
                    </div>
                    <div className="truncate text-[11px] text-ink-500">
                      {formatDate(o.createdAt)} · {o.customerName}
                    </div>
                  </div>
                  <Badge tone="brand">{ORDER_STATUS_LABELS[o.status]}</Badge>
                  <span className="text-[13px] font-bold text-ink-900">
                    {formatPrice(o.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-ink-900">Управление</h2>
        <div className="grid grid-cols-2 gap-3">
          <ServiceCard
            href="/admin/orders"
            icon={<ClipboardList size={20} />}
            label="Заказы"
            sub={`${orders.length} в системе`}
          />
          <ServiceCard
            href="/admin/products"
            icon={<Package size={20} />}
            label="Товары"
            sub={`${PRODUCTS.length} шт`}
          />
          <ServiceCard
            href="/admin/categories"
            icon={<Tag size={20} />}
            label="Категории"
            sub={`${CATEGORIES.length} шт`}
          />
          <ServiceCard
            href="/admin/shops"
            icon={<Store size={20} />}
            label="Магазины"
            sub="0 шт"
          />
          <ServiceCard
            href="/admin/couriers"
            icon={<Truck size={20} />}
            label="Курьеры"
            sub={`${activeCouriers} активных`}
          />
          <ServiceCard
            href="/admin/users"
            icon={<Users size={20} />}
            label="Клиенты"
            sub="0 шт"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="mb-1.5 flex items-center gap-2 font-semibold text-amber-800">
          <Package size={16} />
          Демо-данные
        </div>
        <p className="text-[12px] leading-snug text-amber-800/80">
          Сейчас товары и категории берутся из демо-файлов{" "}
          <code className="rounded bg-amber-100 px-1 font-mono">src/data/</code>.
          После подключения Supabase их можно будет редактировать прямо отсюда.
        </p>
      </section>
    </div>
  );
}

const STAT_TONES: Record<string, string> = {
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-50 text-accent-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
};

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: keyof typeof STAT_TONES | string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          STAT_TONES[tone] ?? STAT_TONES.brand
        }`}
      >
        {icon}
      </div>
      <div className="mt-2 text-[11px] font-medium leading-tight text-ink-500">
        {label}
      </div>
      <div className="mt-0.5 text-[18px] font-extrabold text-ink-900">
        {value}
      </div>
    </div>
  );
}

function ServiceCard({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold text-ink-900">
          {label}
        </div>
        <div className="truncate text-[11px] text-ink-500">{sub}</div>
      </div>
      <ChevronRight size={16} className="text-ink-400" />
    </Link>
  );
}
