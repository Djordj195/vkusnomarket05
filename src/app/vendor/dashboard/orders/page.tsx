import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  PlaceholderCard,
  SubpageHeader,
} from "@/components/vendor/PlaceholderCard";
import { getCurrentVendor } from "@/server/vendor-auth";
import { listOrdersByVendor } from "@/server/orders-store";
import {
  DELIVERY_KIND_LABELS,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { VendorOrdersAutoRefresh } from "./VendorOrdersAutoRefresh";

type Tab = { key: string; label: string; statuses: OrderStatus[] | null };

// Маппим внутренние статусы Order (5 значений) на 8 вкладок-фильтров,
// чтобы UX матчился со словарём ТЗ. Группировка отдельных статусов
// сделана внутри statuses: null = все, иначе пересечение.
const TABS: Tab[] = [
  { key: "all", label: "Все", statuses: null },
  { key: "new", label: "Новые", statuses: ["accepted"] },
  { key: "preparing", label: "В сборке", statuses: ["preparing"] },
  { key: "delivering", label: "В доставке", statuses: ["courier"] },
  { key: "done", label: "Завершено", statuses: ["delivered"] },
  { key: "cancelled", label: "Отмены", statuses: ["cancelled"] },
];

const statusTone: Record<
  OrderStatus,
  "warn" | "info" | "accent" | "success" | "danger"
> = {
  accepted: "info",
  preparing: "warn",
  courier: "accent",
  delivered: "success",
  cancelled: "danger",
};

type SearchParams = Promise<{ status?: string }>;

export const dynamic = "force-dynamic";

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vendor/login");

  const sp = await searchParams;
  const activeKey = sp.status ?? "all";
  const activeTab = TABS.find((t) => t.key === activeKey) ?? TABS[0];

  const all = await listOrdersByVendor(vendor.id);
  const orders =
    activeTab.statuses === null
      ? all
      : all.filter((o) => activeTab.statuses!.includes(o.status));

  const newCount = all.filter((o) => o.status === "accepted").length;

  return (
    <div className="space-y-4">
      <VendorOrdersAutoRefresh />
      <SubpageHeader title="Заказы" />
      {newCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center text-[13px] font-semibold text-amber-800">
          🔔 Новых заказов: {newCount}
        </div>
      )}

      <nav
        className="-mx-1 flex gap-2 overflow-x-auto px-1"
        aria-label="Фильтр статусов"
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <Link
              key={tab.key}
              href={
                tab.key === "all"
                  ? "/vendor/dashboard/orders"
                  : `/vendor/dashboard/orders?status=${tab.key}`
              }
              className={
                isActive
                  ? "shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                  : "shrink-0 rounded-full bg-ink-100 px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-ink-200"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <PlaceholderCard
          title={
            activeTab.key === "all"
              ? "Заказов пока нет"
              : "Нет заказов с этим статусом"
          }
          description={
            activeTab.key === "all"
              ? "Когда клиент оформит заказ в вашем магазине, он появится здесь. Жизненный цикл: новый → подтверждён → в сборке → готов → передан курьеру → завершён."
              : "Попробуйте другую вкладку — например, «Все»."
          }
        />
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const deliveryLabel = order.deliveryKind
    ? DELIVERY_KIND_LABELS[order.deliveryKind]
    : "Доставка";
  const isNew = order.status === "accepted";
  return (
    <li>
      <Link
        href={`/vendor/dashboard/orders/${order.id}`}
        className={`block rounded-2xl border p-3 transition-colors ${
          isNew
            ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
            : "border-ink-200 bg-white hover:bg-ink-50"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] text-ink-500">№ {order.number}</div>
            <div className="text-[13px] font-semibold text-ink-900">
              {formatDate(order.createdAt)}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone={statusTone[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
            <ChevronRight size={14} className="text-ink-400" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px] text-ink-600">
          <span>
            {order.items.length} позиции · {deliveryLabel}
          </span>
          <span className="text-[14px] font-bold text-ink-900">
            {formatPrice(order.total)}
          </span>
        </div>
        {order.address && (
          <div className="mt-1 truncate text-[11px] text-ink-500">
            {order.address}
          </div>
        )}
      </Link>
    </li>
  );
}
