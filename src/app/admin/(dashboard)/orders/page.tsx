import Link from "next/link";
import { listOrders } from "@/server/orders-store";
import { listCouriers } from "@/server/couriers-store";
import { ChevronRight, ClipboardList } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listOrders();
  const couriers = await listCouriers();
  const courierMap = new Map(couriers.map((c) => [c.id, c]));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Заказы</h1>
        <p className="text-[13px] text-ink-500">
          Принимайте заказы, меняйте статус и назначайте курьеров.
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white py-12 text-center">
          <ClipboardList size={28} className="text-ink-400" />
          <h2 className="mt-3 text-[15px] font-bold text-ink-900">
            Заказов пока нет
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
