import Link from "next/link";
import { ClipboardList, Map, History, Wallet, ChevronRight } from "lucide-react";
import { getCurrentCourier } from "@/server/courier-auth";
import { PlaceholderCard } from "@/components/vendor/PlaceholderCard";

export default async function CourierDashboardPage() {
  const courier = await getCurrentCourier();
  if (!courier) return null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Заказы</h1>
        <p className="text-[12px] text-ink-500">
          Назначенные вам доставки появятся ниже.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Tile label="Сегодня" value="0" hint="заказов" />
        <Tile label="В работе" value="0" hint="активных" />
        <Tile label="Заработок" value="—" hint="за смену" />
      </section>

      <PlaceholderCard
        title="Активных заказов нет"
        description="Когда появится новый заказ в вашей зоне, вы получите push-уведомление. Принять заказ можно из этого экрана."
      />

      <section>
        <h2 className="mb-2 text-[14px] font-bold text-ink-900">Разделы</h2>
        <ul className="space-y-2">
          <Row
            href="/courier/dashboard/orders/active"
            icon={<ClipboardList size={20} />}
            label="Активные заказы"
            sub="Со статусами в работе"
          />
          <Row
            href="/courier/dashboard/map"
            icon={<Map size={20} />}
            label="Карта и маршрут"
            sub="Оптимальный путь по точкам"
          />
          <Row
            href="/courier/dashboard/history"
            icon={<History size={20} />}
            label="История доставок"
            sub="Выполненные заказы"
          />
          <Row
            href="/courier/dashboard/profile"
            icon={<Wallet size={20} />}
            label="Профиль и выплаты"
            sub="Документы, баланс"
          />
        </ul>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-3 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="mt-1 text-[20px] font-extrabold text-ink-900">
        {value}
      </div>
      <div className="text-[10px] text-ink-400">{hint}</div>
    </div>
  );
}

function Row({
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
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-ink-900">
            {label}
          </div>
          <div className="truncate text-[11px] text-ink-500">{sub}</div>
        </div>
        <ChevronRight size={16} className="text-ink-400" />
      </Link>
    </li>
  );
}
