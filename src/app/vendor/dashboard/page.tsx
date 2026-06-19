import Link from "next/link";
import {
  ClipboardList,
  Wallet,
  Star,
  Bell,
  Package,
  Truck,
  Store,
  MessageSquare,
  Users,
  Settings,
  ChevronRight,
  Plus,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { getCurrentVendor } from "@/server/vendor-auth";
import { listOrdersByVendor } from "@/server/orders-store";
import { getProductsByVendor } from "@/server/products-store";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { VendorPushBanner } from "./VendorPushBanner";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: "На модерации", tone: "amber" },
  approved: { label: "Активен", tone: "brand" },
  draft: { label: "Черновик", tone: "ink" },
  suspended: { label: "Приостановлен", tone: "amber" },
  blocked: { label: "Заблокирован", tone: "red" },
};

export default async function VendorDashboardOverview() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  const statusInfo = STATUS_LABELS[vendor.status] ?? {
    label: vendor.status,
    tone: "ink",
  };

  const [orders, products] = await Promise.all([
    listOrdersByVendor(vendor.id),
    getProductsByVendor(vendor.id),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const ordersToday = orders.filter(
    (o) => new Date(o.createdAt).getTime() >= todayMs
  );
  const revenueToday = ordersToday
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const activeCount = orders.filter(
    (o) => o.status === "accepted" || o.status === "preparing" || o.status === "courier"
  ).length;
  const newOrdersCount = orders.filter((o) => o.status === "accepted").length;
  const productCount = products.length;
  const inStockCount = products.filter((p) => p.inStock).length;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  return (
    <div className="space-y-5">
      <VendorPushBanner vendorId={vendor.id} vapidPublicKey={vapidPublicKey} />

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold text-ink-900">Обзор</h1>
          <p className="truncate text-[12px] text-ink-500">
            {vendor.brandName}
          </p>
        </div>
        <Badge tone={statusInfo.tone as "brand"}>{statusInfo.label}</Badge>
      </header>

      {/* Quick actions */}
      <section className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        <QuickAction
          href="/vendor/dashboard/catalog"
          icon={<Plus size={16} />}
          label="Добавить товар"
          tone="bg-brand-600 text-white"
        />
        <QuickAction
          href="/vendor/dashboard/orders?status=new"
          icon={<Bell size={16} />}
          label={newOrdersCount > 0 ? `Новые заказы (${newOrdersCount})` : "Заказы"}
          tone={newOrdersCount > 0 ? "bg-amber-500 text-white" : "bg-ink-100 text-ink-700"}
        />
        <QuickAction
          href="/vendor/dashboard/storefront"
          icon={<Store size={16} />}
          label="Витрина"
          tone="bg-ink-100 text-ink-700"
        />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          href="/vendor/dashboard/orders"
          icon={<ClipboardList size={18} />}
          label="Заказы сегодня"
          value={String(ordersToday.length)}
          tone="brand"
          hint={ordersToday.length ? `Из них новых: ${newOrdersCount}` : "Пока тихо"}
        />
        <StatTile
          href="/vendor/dashboard/finances"
          icon={<Wallet size={18} />}
          label="Выручка сегодня"
          value={revenueToday ? formatPrice(revenueToday) : "—"}
          tone="accent"
          hint="Готовые заказы без отмен"
        />
        <StatTile
          href="/vendor/dashboard/orders?status=preparing"
          icon={<TrendingUp size={18} />}
          label="Активные"
          value={String(activeCount)}
          tone="amber"
          hint="В сборке и доставке"
        />
        <StatTile
          href="/vendor/dashboard/reviews"
          icon={<Star size={18} />}
          label="Рейтинг"
          value={vendor.ratingAvg ? vendor.ratingAvg.toFixed(1) : "—"}
          tone="sky"
          hint={
            vendor.ratingCount
              ? `${vendor.ratingCount} отзывов`
              : "Отзывов пока нет"
          }
        />
        <StatTile
          href="/vendor/dashboard/catalog"
          icon={<ShoppingBag size={18} />}
          label="Товаров"
          value={String(productCount)}
          tone="brand"
          hint={`В наличии: ${inStockCount}`}
        />
      </section>

      {/* Alerts */}
      {newOrdersCount > 0 ? (
        <Link
          href="/vendor/dashboard/orders?status=new"
          className="block rounded-2xl border border-amber-300 bg-amber-50 p-4 transition hover:bg-amber-100"
        >
          <h2 className="text-[14px] font-bold text-amber-900">
            Новых заказов: {newOrdersCount}
          </h2>
          <p className="mt-1 text-[12px] text-amber-800/90">
            Нажмите чтобы принять или отклонить заказы
          </p>
        </Link>
      ) : productCount === 0 ? (
        <Link
          href="/vendor/dashboard/catalog"
          className="block rounded-2xl border border-brand-200 bg-brand-50 p-4 transition hover:bg-brand-100"
        >
          <h2 className="text-[14px] font-bold text-brand-900">
            Добавьте первый товар
          </h2>
          <p className="mt-1 text-[12px] text-brand-800/90">
            Ваш каталог пуст. Добавьте товары чтобы клиенты могли оформлять заказы.
          </p>
        </Link>
      ) : (
        <section className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
          <h2 className="text-[14px] font-bold text-ink-700">Всё спокойно</h2>
          <p className="mt-1 text-[12px] text-ink-500">
            Нет активных алертов. Заказы и уведомления появятся здесь автоматически.
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-ink-900">Управление</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ServiceCard
            href="/vendor/dashboard/storefront"
            icon={<Store size={20} />}
            label="Витрина"
            sub="Логотип, баннер, описание"
          />
          <ServiceCard
            href="/vendor/dashboard/catalog"
            icon={<Package size={20} />}
            label="Каталог"
            sub="Товары и категории"
          />
          <ServiceCard
            href="/vendor/dashboard/orders"
            icon={<ClipboardList size={20} />}
            label="Заказы"
            sub="Новые, в сборке, доставка"
          />
          <ServiceCard
            href="/vendor/dashboard/couriers"
            icon={<Truck size={20} />}
            label="Курьеры"
            sub="Свои курьеры и KPI"
          />
          <ServiceCard
            href="/vendor/dashboard/reviews"
            icon={<MessageSquare size={20} />}
            label="Отзывы"
            sub="Ответы и рейтинг"
          />
          <ServiceCard
            href="/vendor/dashboard/finances"
            icon={<Wallet size={20} />}
            label="Финансы"
            sub="Выплаты, тариф, акты"
          />
          <ServiceCard
            href="/vendor/dashboard/staff"
            icon={<Users size={20} />}
            label="Сотрудники"
            sub="Роли и команда"
          />
          <ServiceCard
            href="/vendor/dashboard/settings"
            icon={<Settings size={20} />}
            label="Настройки"
            sub="Реквизиты, документы"
          />
        </div>
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

function StatTile({
  href,
  icon,
  label,
  value,
  tone,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-ink-200 bg-white p-3 transition hover:border-brand-300 hover:bg-brand-50"
    >
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
      {hint && (
        <div className="mt-0.5 truncate text-[10px] text-ink-400">{hint}</div>
      )}
    </Link>
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

function QuickAction({
  href,
  icon,
  label,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition-opacity hover:opacity-90 ${tone}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
