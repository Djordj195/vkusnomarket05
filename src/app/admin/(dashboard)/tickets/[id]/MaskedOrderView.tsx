"use client";

import { useEffect, useState } from "react";
import { Package, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUS_LABELS, PAYMENT_LABELS, type Order } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { getMaskedOrderAction } from "@/server/orders-masked-action";

function maskPhone(phone: string): string {
  if (phone.length < 6) return "***";
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

function maskAddress(address: string): string {
  const parts = address.split(",");
  if (parts.length <= 1) return parts[0]?.slice(0, 10) + "...";
  return parts[0] + ", ***";
}

function maskName(name: string): string {
  if (!name) return "***";
  return name[0] + "***";
}

const STATUS_TONE: Record<string, "warn" | "info" | "success" | "danger" | "neutral"> = {
  accepted: "info",
  preparing: "warn",
  courier: "info",
  delivered: "success",
  cancelled: "danger",
};

export function MaskedOrderView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMaskedOrderAction(orderId).then((o) => {
      if (!cancelled) {
        setOrder(o);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-4 text-center text-[13px] text-ink-500">
        Загрузка заказа…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-4 text-center text-[13px] text-ink-500">
        Заказ {orderId} не найден.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-ink-500" />
          <h3 className="text-[14px] font-bold text-ink-900">
            Заказ {order.number}
          </h3>
          <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
        <button
          type="button"
          onClick={() => setShowFull(!showFull)}
          className="flex items-center gap-1 text-[11px] text-brand-600 hover:underline"
        >
          {showFull ? <EyeOff size={12} /> : <Eye size={12} />}
          {showFull ? "Скрыть" : "Показать полностью"}
        </button>
      </div>

      <div className="space-y-1.5 text-[13px]">
        <div className="flex justify-between">
          <span className="text-ink-500">Клиент</span>
          <span className="text-ink-900 font-medium">
            {showFull ? order.customerName : maskName(order.customerName)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Телефон</span>
          <span className="text-ink-900 font-medium">
            {showFull ? order.customerPhone : maskPhone(order.customerPhone)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Адрес</span>
          <span className="text-ink-900 font-medium text-right max-w-[200px]">
            {showFull ? order.address : maskAddress(order.address)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Оплата</span>
          <span className="text-ink-900 font-medium">
            {PAYMENT_LABELS[order.payment]}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Сумма</span>
          <span className="text-ink-900 font-bold">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-ink-500">
          Состав ({order.items.length} поз.)
        </div>
        <ul className="space-y-1">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between text-[12px]">
              <span className="text-ink-700 truncate max-w-[180px]">
                {item.name} × {item.quantity}
              </span>
              <span className="text-ink-900 font-medium shrink-0">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
