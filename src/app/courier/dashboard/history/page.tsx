import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { History } from "lucide-react";
import { getCurrentCourier } from "@/server/courier-auth";
import { listOrderHistoryByCourier } from "@/server/orders-store";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  COURIER_STAGE_LABELS,
  ORDER_STATUS_LABELS,
  type CourierStage,
  type OrderStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const tone: Record<OrderStatus, "success" | "danger" | "info" | "warn" | "accent"> = {
  accepted: "info",
  preparing: "warn",
  courier: "accent",
  delivered: "success",
  cancelled: "danger",
};

export default async function CourierHistoryHubPage() {
  const courier = await getCurrentCourier();
  if (!courier) redirect("/courier/login");

  const orders = await listOrderHistoryByCourier(courier.id);
  const earnings = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + (o.deliveryFee ?? 0), 0);

  return (
    <div className="space-y-4">
      <SubpageHeader title="История доставок" backHref="/courier/dashboard" />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Всего" value={String(orders.length)} hint="заказов" />
        <Stat
          label="Доход"
          value={earnings > 0 ? `${earnings} ₽` : "—"}
          hint="за всё время"
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={History}
          title="История пуста"
          description="После завершения первой доставки заказы появятся здесь."
        />
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl border border-ink-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[12px] text-ink-500">
                    Заказ № {o.number}
                  </div>
                  <div className="mt-0.5 text-[14px] font-semibold text-ink-900">
                    {formatDate(o.createdAt)}
                  </div>
                </div>
                <Badge tone={tone[o.status]}>
                  {ORDER_STATUS_LABELS[o.status]}
                </Badge>
              </div>
              <div className="mt-2 text-[12px] text-ink-600">{o.address}</div>
              {o.courierStage && (
                <div className="mt-1 text-[11px] text-ink-500">
                  Финал: {COURIER_STAGE_LABELS[o.courierStage as CourierStage]}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[12px] text-ink-500">
                  {o.items.length} позиций
                </span>
                <span className="text-[14px] font-bold text-ink-900">
                  {formatPrice(o.deliveryFee)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({
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
