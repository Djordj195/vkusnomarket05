"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  ShoppingBag,
  Store,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  COURIER_STAGE_FLOW,
  COURIER_STAGE_LABELS,
  type CourierStage,
} from "@/lib/types";
import type { CourierOrderItem } from "@/lib/courier-orders";
import { formatPrice } from "@/lib/utils";

const POLL_INTERVAL_MS = 5000;

export function CourierActiveOrders({
  initial,
}: {
  initial: CourierOrderItem[];
}) {
  const [items, setItems] = useState<CourierOrderItem[]>(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/courier/orders?scope=active", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: CourierOrderItem[] };
      setItems(data.items);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось обновить");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const advance = async (orderId: string, stage: CourierStage) => {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/courier/orders/${orderId}/stage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить статус");
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <RefreshBar refreshing={refreshing} onClick={refresh} />
        <EmptyState
          icon={ShoppingBag}
          title="Активных заказов нет"
          description="Когда вам назначат заказ, он появится здесь автоматически. Страница обновляется каждые 5 секунд."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RefreshBar refreshing={refreshing} onClick={refresh} />
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
          {error}
        </div>
      )}
      <ul className="space-y-3">
        {items.map((it) => (
          <ActiveOrderCard
            key={it.order.id}
            item={it}
            busy={busyId === it.order.id}
            onAdvance={(stage) => advance(it.order.id, stage)}
          />
        ))}
      </ul>
    </div>
  );
}

function RefreshBar({
  refreshing,
  onClick,
}: {
  refreshing: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-3 py-2 text-[12px] text-brand-800">
      <span>Обновляется каждые 5 секунд</span>
      <button
        type="button"
        onClick={onClick}
        disabled={refreshing}
        className="flex items-center gap-1 font-semibold text-brand-700 disabled:opacity-50"
      >
        <RefreshCw
          size={14}
          className={refreshing ? "animate-spin" : undefined}
        />
        {refreshing ? "Обновляю…" : "Обновить"}
      </button>
    </div>
  );
}

function ActiveOrderCard({
  item,
  busy,
  onAdvance,
}: {
  item: CourierOrderItem;
  busy: boolean;
  onAdvance: (stage: CourierStage) => void;
}) {
  const { order, vendor, pickup } = item;
  const currentStage: CourierStage | null = order.courierStage ?? null;

  const nextStage = useMemo<CourierStage | null>(() => {
    if (!currentStage) return COURIER_STAGE_FLOW[0];
    const idx = COURIER_STAGE_FLOW.indexOf(currentStage);
    if (idx < 0) return COURIER_STAGE_FLOW[0];
    return COURIER_STAGE_FLOW[idx + 1] ?? null;
  }, [currentStage]);

  const customerPhone = order.customerPhone;
  const customerGeo = order.geo;

  const navUrl = (to: { lat: number; lng: number; label?: string }) => {
    const q = `${to.lat},${to.lng}`;
    return `https://yandex.ru/maps/?rtext=~${encodeURIComponent(q)}&rtt=auto`;
  };

  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[12px] text-ink-500">
            Заказ № {order.number}
          </div>
          <div className="mt-0.5 text-[14px] font-bold text-ink-900">
            {vendor?.brandName ?? "Платформенный заказ"}
          </div>
        </div>
        <Badge tone="accent">
          {currentStage
            ? COURIER_STAGE_LABELS[currentStage]
            : "Назначен"}
        </Badge>
      </div>

      <div className="mt-3 space-y-2 text-[13px] text-ink-700">
        <Row
          icon={<Store size={14} />}
          title="Точка забора"
          subtitle={pickup?.label ?? "—"}
          action={
            pickup ? (
              <a
                href={navUrl(pickup)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 underline"
              >
                В навигаторе
              </a>
            ) : null
          }
        />
        <Row
          icon={<MapPin size={14} />}
          title="Адрес клиента"
          subtitle={order.address}
          action={
            customerGeo ? (
              <a
                href={navUrl(customerGeo)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 underline"
              >
                В навигаторе
              </a>
            ) : null
          }
        />
        <Row
          icon={<Phone size={14} />}
          title={order.customerName || "Клиент"}
          subtitle={customerPhone}
          action={
            customerPhone ? (
              <a
                href={`tel:${customerPhone}`}
                className="text-brand-700 underline"
              >
                Позвонить
              </a>
            ) : null
          }
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[12px] text-ink-600">
        <span>{order.items.length} позиций</span>
        <span className="font-bold text-ink-900">
          {formatPrice(order.total)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {nextStage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAdvance(nextStage)}
            disabled={busy}
            className="w-full justify-center"
          >
            <Navigation size={14} />
            {COURIER_STAGE_LABELS[nextStage]}
          </Button>
        )}
        {!nextStage && (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="w-full justify-center"
          >
            Все шаги выполнены
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAdvance("failed")}
          disabled={busy}
          className="w-full justify-center text-red-700 hover:bg-red-50"
        >
          <XCircle size={14} />
          Не удалось
        </Button>
      </div>

    </li>
  );
}

function Row({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          {title}
        </div>
        <div className="truncate text-[13px] text-ink-800">{subtitle}</div>
      </div>
      {action && <div className="text-[12px]">{action}</div>}
    </div>
  );
}
