"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Package, Truck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorUpdateOrderStatus } from "@/server/vendor-orders-actions";
import type { OrderStatus } from "@/lib/types";

type Action = {
  status: OrderStatus;
  label: string;
  icon: React.ReactNode;
  tone: string;
};

const ACTIONS_BY_STATUS: Record<string, Action[]> = {
  accepted: [
    {
      status: "preparing",
      label: "Принять в работу",
      icon: <Package size={18} />,
      tone: "bg-brand-600 hover:bg-brand-700 text-white",
    },
    {
      status: "cancelled",
      label: "Отклонить",
      icon: <XCircle size={18} />,
      tone: "bg-red-100 hover:bg-red-200 text-red-700",
    },
  ],
  preparing: [
    {
      status: "courier",
      label: "Готов к выдаче курьеру",
      icon: <Truck size={18} />,
      tone: "bg-brand-600 hover:bg-brand-700 text-white",
    },
  ],
};

export function VendorOrderActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const actions = ACTIONS_BY_STATUS[currentStatus];

  if (!actions || actions.length === 0) {
    const labels: Record<string, string> = {
      courier: "Заказ передан курьеру",
      delivered: "Заказ доставлен",
      cancelled: "Заказ отменён",
    };
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-ink-50 p-4 text-[13px] text-ink-600">
        <Check size={16} className="text-brand-600" />
        {labels[currentStatus] ?? "Действия недоступны"}
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-[13px] font-semibold text-green-700">
        <Check size={16} />
        Статус обновлён
      </div>
    );
  }

  const handleAction = (status: OrderStatus) => {
    setError(null);
    startTransition(async () => {
      const res = await vendorUpdateOrderStatus(orderId, status);
      if (!res.ok) {
        setError(res.error ?? "Ошибка");
      } else {
        setDone(true);
      }
    });
  };

  return (
    <section className="space-y-2">
      {actions.map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={pending}
          onClick={() => handleAction(action.status)}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[14px] font-bold transition-colors",
            action.tone,
            pending && "opacity-60"
          )}
        >
          {pending ? <Loader2 size={18} className="animate-spin" /> : action.icon}
          {action.label}
        </button>
      ))}
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-[12px] text-red-700">
          {error}
        </div>
      )}
    </section>
  );
}
