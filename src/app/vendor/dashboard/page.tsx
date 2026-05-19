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
} from "lucide-react";
import { getCurrentVendor } from "@/server/vendor-auth";
import { Badge } from "@/components/ui/Badge";

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

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold text-ink-900">Обзор</h1>
          <p className="truncate text-[12px] text-ink-500">
            {vendor.brandName}
          </p>
        </div>
        <Badge tone={statusInfo.tone as "brand"}>{statusInfo.label}</Badge>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <StatTile
          href="/vendor/dashboard/orders"
          icon={<ClipboardList size={18} />}
          label="Заказы сегодня"
          value="—"
          tone="brand"
          hint="Данные в обработке"
        />
        <StatTile
          href="/vendor/dashboard/finances"
          icon={<Wallet size={18} />}
          label="Выручка"
          value="—"
          tone="accent"
          hint="Данные в обработке"
        />
        <StatTile
          href="/vendor/dashboard/orders?status=active"
          icon={<Bell size={18} />}
          label="Активные"
          value="—"
          tone="amber"
          hint="Данные в обработке"
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
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-[14px] font-bold text-amber-900">Алерты</h2>
        <p className="mt-1 text-[12px] text-amber-800/90">
          Здесь будут показываться важные уведомления о заказах, отзывах и
          выплатах. Сейчас активных алертов нет.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-ink-900">Управление</h2>
        <div className="grid grid-cols-2 gap-3">
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
