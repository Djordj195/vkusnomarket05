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

export function CourierAssignSection({
  orderId,
  currentCourierId,
  couriers,
}: {
  orderId: string;
  currentCourierId?: string;
  couriers: Courier[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string>(
    currentCourierId ?? ""
  );

  const courierDirty =
    selectedCourier !== "" && selectedCourier !== (currentCourierId ?? "");

  const save = () => {
    if (!courierDirty) return;
    setError(null);
    startTransition(async () => {
      const res = await assignCourier(orderId, selectedCourier);
      if (!res.ok) setError(res.error ?? "Ошибка");
    });
  };

  const activeCouriers = couriers.filter((c) => c.isActive);

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-4">
      <h2 className="mb-3 text-[15px] font-bold text-ink-900">
        Назначить курьера
      </h2>
      {activeCouriers.length === 0 ? (
        <p className="text-[13px] text-ink-500">Нет активных курьеров.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {activeCouriers.map((c) => {
              const active = selectedCourier === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCourier(c.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors",
                    active
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <Button
            fullWidth
            size="md"
            className="mt-3"
            variant="accent"
            disabled={!courierDirty || pending}
            onClick={save}
          >
            {pending ? "Сохраняем..." : "Сохранить изменения"}
          </Button>
          {error && (
            <div className="mt-2 rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
              {error}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function StatusSection({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<OrderStatus>(currentStatus);

  const dirty = selectedStatus !== currentStatus;

  const save = () => {
    if (!dirty) return;
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, selectedStatus);
      if (!res.ok) setError(res.error ?? "Ошибка");
    });
  };

  const stepIndex = ORDER_STATUS_FLOW.indexOf(selectedStatus);

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-4">
      <h2 className="mb-3 text-[15px] font-bold text-ink-900">Статус</h2>
      <div className="flex flex-wrap gap-2">
        {ORDER_STATUS_FLOW.map((s, i) => {
          const active = selectedStatus === s;
          const done = stepIndex >= i;
          return (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => setSelectedStatus(s)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors",
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : done
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-700"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  active || done
                    ? "bg-white/20 text-current"
                    : "bg-ink-100 text-ink-500"
                )}
              >
                {done ? <Check size={12} /> : i + 1}
              </span>
              {ORDER_STATUS_LABELS[s]}
            </button>
          );
        })}
        <button
          key="cancelled"
          type="button"
          disabled={pending}
          onClick={() => setSelectedStatus("cancelled")}
          className={cn(
            "rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors",
            selectedStatus === "cancelled"
              ? "border-red-500 bg-red-500 text-white"
              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          )}
        >
          {ORDER_STATUS_LABELS.cancelled}
        </button>
      </div>
      <Button
        fullWidth
        size="md"
        className="mt-3"
        disabled={!dirty || pending}
        onClick={save}
      >
        {pending ? "Сохраняем..." : "Сохранить изменения"}
      </Button>
      {error && (
        <div className="mt-2 rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
          {error}
        </div>
      )}
    </section>
  );
}
