import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, History, Map, Wallet, ChevronRight } from "lucide-react";
import { getCurrentCourier } from "@/server/courier-auth";
import {
  listActiveOrdersByCourier,
  listOrderHistoryByCourier,
} from "@/server/orders-store";
import { CourierActiveSummary } from "./CourierActiveSummary";

export const dynamic = "force-dynamic";

export default async function CourierDashboardPage() {
  const courier = await getCurrentCourier();
  if (!courier) redirect("/courier/login");

  const [active, history] = await Promise.all([
    listActiveOrdersByCourier(courier.id),
    listOrderHistoryByCourier(courier.id),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();

  const deliveredToday = history.filter(
    (o) => o.status === "delivered" && o.createdAt >= startOfToday
  );
  const todayEarnings = deliveredToday.reduce(
    (s, o) => s + (o.deliveryFee ?? 0),
    0
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Заказы</h1>
        <p className="text-[12px] text-ink-500">
          Назначенные вам доставки появятся ниже. Страница обновляется
          автоматически.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Tile
          label="Сегодня"
          value={String(deliveredToday.length)}
          hint="доставлено"
        />
        <Tile
          label="В работе"
          value={String(active.length)}
          hint="активных"
        />
        <Tile
          label="Заработок"
          value={todayEarnings > 0 ? `${todayEarnings} ₽` : "—"}
          hint="за сегодня"
        />
      </section>

      <CourierActiveSummary initialCount={active.length} />

      <section>
        <h2 className="mb-2 text-[14px] font-bold text-ink-900">Разделы</h2>
        <ul className="space-y-2">
          <Row
            href="/courier/dashboard/orders/active"
            icon={<ClipboardList size={20} />}
            label="Активные заказы"
            sub={
              active.length > 0
                ? `${active.length} в работе`
                : "Со статусами в работе"
            }
          />
          <Row
            href="/courier/dashboard/map"
            icon={<Map size={20} />}
            label="Карта и маршрут"
            sub="Маршрут «магазин → клиент»"
          />
          <Row
            href="/courier/dashboard/history"
            icon={<History size={20} />}
            label="История доставок"
            sub={
              history.length > 0
                ? `${history.length} выполненных`
                : "Выполненные заказы"
            }
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
