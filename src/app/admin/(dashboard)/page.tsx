import Link from "next/link";
import {
  Bell,
  ClipboardList,
  Package,
  Truck,
  Wallet,
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[24px] font-extrabold text-ink-900">Обзор</h1>
        <p className="text-[14px] text-ink-500">
          Сводка по заказам и каталогу.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Заказы сегодня"
          value={todayOrders.length.toString()}
          color="bg-brand-50 text-brand-700"
        />
        <StatCard
          icon={<Wallet size={20} />}
          label="Выручка сегодня"
          value={formatPrice(revenue)}
          color="bg-accent-50 text-accent-700"
        />
        <StatCard
          icon={<Bell size={20} />}
          label="Активные"
          value={activeOrders.length.toString()}
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          icon={<Truck size={20} />}
          label="Курьеры"
          value={`${couriers.filter((c) => c.isActive).length} / ${couriers.length}`}
          color="bg-sky-50 text-sky-700"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-ink-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-ink-900">Каталог</h2>
            <Link
              href="/admin/products"
              className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
            >
              Управлять
            </Link>
          </div>
          <ul className="text-[14px] space-y-1.5 text-ink-700">
            <Row label="Товаров" value={PRODUCTS.length} />
            <Row label="Категорий" value={CATEGORIES.length} />
            <Row label="Магазинов / лавок" value={0} />
          </ul>
        </div>

        <div className="rounded-2xl bg-white border border-ink-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-ink-900">
              Последние заказы
            </h2>
            <Link
              href="/admin/orders"
              className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
            >
              Все
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-[13px] text-ink-500">Заказов пока нет.</p>
          ) : (
            <ul className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-ink-50"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-ink-900">
                        № {o.number}
                      </div>
                      <div className="text-[11px] text-ink-500">
                        {formatDate(o.createdAt)} · {o.customerName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">
                        {ORDER_STATUS_LABELS[o.status]}
                      </Badge>
                      <span className="text-[14px] font-bold text-ink-900">
                        {formatPrice(o.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2 mb-1.5 text-amber-800 font-semibold">
          <Package size={18} />
          Демо-данные
        </div>
        <p className="text-[13px] text-amber-800/80 leading-snug">
          Сейчас товары и категории берутся из демо-данных в файлах
          <code className="mx-1 rounded bg-amber-100 px-1 font-mono">src/data/</code>.
          После подключения базы данных Supabase их можно будет добавлять и
          редактировать прямо отсюда.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-ink-200 p-4">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}
      >
        {icon}
      </div>
      <div className="mt-3 text-[12px] font-medium text-ink-500">{label}</div>
      <div className="mt-0.5 text-[20px] font-extrabold text-ink-900">
        {value}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <li className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </li>
  );
}
