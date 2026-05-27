"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Truck } from "lucide-react";
import { PlaceholderCard } from "@/components/vendor/PlaceholderCard";

const POLL_INTERVAL_MS = 8000;

/**
 * Лёгкая клиентская обёртка над сводкой активных заказов на дашборде
 * курьера. Изначальное число приходит из SSR, далее раз в 8 секунд
 * запрашиваем /api/courier/orders?scope=active и обновляем счётчик.
 */
export function CourierActiveSummary({
  initialCount,
}: {
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/courier/orders?scope=active", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: unknown[] };
      setCount(data.items.length);
    } catch {
      /* network blip; keep last known count */
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  if (count === 0) {
    return (
      <PlaceholderCard
        title="Активных заказов нет"
        description="Когда появится новый заказ в вашей зоне, он появится здесь автоматически — без перезагрузки."
      />
    );
  }

  return (
    <Link
      href="/courier/dashboard/orders/active"
      className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 hover:bg-brand-100"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-200 text-brand-700">
        {count > 1 ? <Truck size={20} /> : <ShoppingBag size={20} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold text-brand-900">
          {count} {count === 1 ? "активный заказ" : count < 5 ? "активных заказа" : "активных заказов"}
        </div>
        <div className="text-[12px] text-brand-700">
          Откройте, чтобы переключить статус или открыть в навигаторе
        </div>
      </div>
      <ArrowRight size={18} className="text-brand-700" />
    </Link>
  );
}
