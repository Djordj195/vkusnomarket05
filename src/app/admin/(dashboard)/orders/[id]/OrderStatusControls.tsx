"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  type Courier,
  type OrderStatus,
} from "@/lib/types";
import {
  assignCourier,
  updateOrderStatus,
} from "@/server/orders-actions";

export function OrderStatusControls({
  orderId,
  currentStatus,
  currentCourierId,
  couriers,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  currentCourierId?: string;
  couriers: Courier[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string>(
    currentCourierId ?? ""
  );

  const handleStatus = (status: OrderStatus) => {
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, status);
      if (!res.ok) setError(res.error ?? "Ошибка");
    });
  };

  const handleAssignCourier = () => {
    if (!selectedCourier) return;
    setError(null);
    startTransition(async () => {
      const res = await assignCourier(orderId, selectedCourier);
      if (!res.ok) setError(res.error ?? "Ошибка");
    });
  };

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="mb-3 text-[15px] font-bold text-ink-900">Статус</h2>
        <ol className="space-y-1.5">
          {ORDER_STATUS_FLOW.map((s, i) => {
            const stepIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
            const done = stepIndex >= i;
            const active = stepIndex === i;
            return (
              <li key={s}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleStatus(s)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px]",
                    active
                      ? "bg-brand-50 font-bold text-brand-700"
                      : done
                      ? "text-ink-700 hover:bg-ink-50"
                      : "text-ink-500 hover:bg-ink-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px]",
                      done
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-ink-300 bg-white text-ink-500"
                    )}
                  >
                    {done ? <Check size={12} /> : i + 1}
                  </span>
                  {ORDER_STATUS_LABELS[s]}
                </button>
              </li>
            );
          })}
        </ol>
        {currentStatus !== "cancelled" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => handleStatus("cancelled")}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-[12px] text-red-600 hover:bg-red-50"
          >
            Отменить заказ
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="mb-3 text-[15px] font-bold text-ink-900">
          Назначить курьера
        </h2>
        {couriers.length === 0 ? (
          <p className="text-[13px] text-ink-500">
            Курьеры пока не добавлены. Перейдите в раздел «Курьеры».
          </p>
        ) : (
          <div className="space-y-3">
            <select
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
              className="block w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            >
              <option value="">— выберите курьера —</option>
              {couriers
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.phone}
                  </option>
                ))}
            </select>
            <Button
              fullWidth
              size="md"
              disabled={!selectedCourier || pending}
              onClick={handleAssignCourier}
              variant="accent"
            >
              {pending ? "Сохраняем..." : "Назначить и передать курьеру"}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-3 text-[13px] text-red-700">
          {error}
        </div>
      )}
    </aside>
  );
}
