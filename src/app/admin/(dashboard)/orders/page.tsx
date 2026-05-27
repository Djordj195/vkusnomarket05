import Link from "next/link";
import { listOrders } from "@/server/orders-store";
import { listCouriers } from "@/server/couriers-store";
import { listVendors } from "@/server/vendors-store";
import { ChevronRight, ClipboardList } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; range?: string }>;

const FILTER_TABS: { key: string; label: string; href: string }[] = [
  { key: "all", label: "Все", href: "/admin/orders" },
  { key: "today", label: "Сегодня", href: "/admin/orders?range=today" },
  { key: "active", label: "Активные", href: "/admin/orders?status=active" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const [all, couriers, vendors] = await Promise.all([
    listOrders(),
    listCouriers(),
    listVendors(),
  ]);
  const courierMap = new Map(couriers.map((c) => [c.id, c]));
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  let orders = all;
  let activeKey = "all";
  let emptyLabel = "Заказов пока нет";

  if (sp.range === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    orders = all.filter(
      (o) => new Date(o.createdAt).getTime() >= start.getTime()
    );
    activeKey = "today";
    emptyLabel = "Сегодня заказов ещё не было";
  } else if (sp.status === "active") {
    orders = all.filter(
      (o) => o.status !== "delivered" && o.status !== "cancelled"
    );
    activeKey = "active";
    emptyLabel = "Сейчас активных заказов нет";
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Заказы</h1>
        <p className="text-[13px] text-ink-500">
          Принимайте заказы, меняйте статус и назначайте курьеров.
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto" aria-label="Фильтр заказов">
        {FILTER_TABS.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={
                isActive
                  ? "rounded-full bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                  : "rounded-full bg-ink-100 px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-ink-200"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white py-12 text-center">
          <ClipboardList size={28} className="text-ink-400" />
          <h2 className="mt-3 text-[15px] font-bold text-ink-900">
            {emptyLabel}
          </h2>
          <p className="mt-1 max-w-xs px-4 text-[12px] text-ink-500">
            Когда клиент оформит заказ, он появится здесь, и вы получите
            уведомление в Telegram.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => {
            const courier = o.courierId ? courierMap.get(o.courierId) : null;
            const vendor = o.vendorId ? vendorMap.get(o.vendorId) : null;
            return (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-ink-900">
                        № {o.number}
                      </span>
                      <Badge tone="brand">
                        {ORDER_STATUS_LABELS[o.status]}
                      </Badge>
                      {vendor && (
                        <span className="truncate rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
                          {vendor.brandName}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate text-[12px] text-ink-700">
                      {o.customerName} · {o.customerPhone}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-ink-500">
                      {formatDate(o.createdAt)}
                      {courier ? ` · 🛵 ${courier.name}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="whitespace-nowrap text-[15px] font-extrabold text-ink-900">
                      {formatPrice(o.total)}
                    </div>
                    <ChevronRight
                      size={16}
                      className="ml-auto mt-1 text-ink-400"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
