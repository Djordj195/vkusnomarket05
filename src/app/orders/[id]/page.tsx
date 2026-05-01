"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Phone, MapPin, ClipboardList } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useOrders } from "@/store/orders";
import { formatDate, formatPrice, cn } from "@/lib/utils";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  type OrderStatus,
} from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function OrderPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const order = useOrders((s) => s.orders.find((o) => o.id === id));
  const upsert = useOrders((s) => s.upsert);
  const searchParams = useSearchParams();
  const isNew = searchParams?.get("new") === "1";

  const [polledCourier, setPolledCourier] = useState<{
    name: string;
    phone: string;
  } | null>(null);

  // Подтягиваем актуальный статус с сервера, чтобы пользователь видел
  // изменения, сделанные администратором.
  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: OrderStatus;
          courierId?: string;
          courier?: { name: string; phone: string } | null;
        };
        if (cancelled) return;
        if (data.status !== order.status || data.courierId !== order.courierId) {
          upsert({ ...order, status: data.status, courierId: data.courierId });
        }
        if (data.courier) setPolledCourier(data.courier);
        else if (data.courier === null) setPolledCourier(null);
      } catch {
        /* network error: silently retry next tick */
      }
    };
    tick();
    const id = setInterval(tick, 12000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [order, upsert]);

  if (!order) {
    return (
      <PageShell>
        <Header variant="page" title="Заказ" showBack />
        <EmptyState
          icon={ClipboardList}
          title="Заказ не найден"
          description="Возможно, он был удалён или это другой телефон."
          action={
            <Button onClick={() => router.replace("/orders")}>
              К моим заказам
            </Button>
          }
        />
      </PageShell>
    );
  }

  const stepIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <PageShell>
      <Header variant="page" title={`Заказ № ${order.number}`} showBack />
      <div className="px-4 pt-2 pb-4 space-y-5">
        {isNew && (
          <div className="rounded-2xl bg-brand-50 p-4 text-[14px] text-brand-800">
            <div className="flex items-center gap-2 font-bold">
              <Check size={18} />
              Заказ принят!
            </div>
            <p className="mt-1 text-[13px] text-brand-700">
              Мы получили ваш заказ. Менеджер свяжется с вами для подтверждения.
            </p>
          </div>
        )}

        <section>
          <h2 className="mb-3 text-[15px] font-bold text-ink-900">Статус</h2>
          <div className="rounded-2xl border border-ink-200 p-4">
            <ol className="space-y-3">
              {ORDER_STATUS_FLOW.map((s, i) => {
                const done = stepIndex >= i;
                const active = stepIndex === i;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                        done
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-ink-200 bg-white text-ink-400"
                      )}
                    >
                      {done ? <Check size={14} /> : <span className="text-[11px]">{i + 1}</span>}
                    </span>
                    <span
                      className={cn(
                        "text-[14px]",
                        active
                          ? "font-bold text-ink-900"
                          : done
                          ? "font-medium text-ink-700"
                          : "text-ink-500"
                      )}
                    >
                      {ORDER_STATUS_LABELS[s]}
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-3 text-[12px] text-ink-500">
              Дата заказа: {formatDate(order.createdAt)}
            </div>
          </div>
        </section>

        {order.status === "courier" && polledCourier && (
          <section>
            <h2 className="mb-3 text-[15px] font-bold text-ink-900">
              Ваш курьер
            </h2>
            <div className="flex items-center justify-between rounded-2xl bg-accent-50 p-4">
              <div>
                <div className="text-[14px] font-semibold text-ink-900">
                  {polledCourier.name}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-600">
                  {polledCourier.phone}
                </div>
              </div>
              <a
                href={`tel:${polledCourier.phone.replace(/[^+\d]/g, "")}`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-500 text-white shadow-sm shadow-accent-500/30"
                aria-label="Позвонить курьеру"
              >
                <Phone size={18} />
              </a>
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-[15px] font-bold text-ink-900">Состав</h2>
          <div className="space-y-2">
            {order.items.map((it) => (
              <div
                key={it.productId}
                className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3"
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white">
                  <Image
                    src={it.image}
                    alt={it.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium text-ink-900">
                    {it.name}
                  </div>
                  <div className="text-[12px] text-ink-500">
                    {it.quantity} × {formatPrice(it.price)} / {it.unit}
                  </div>
                </div>
                <div className="text-[14px] font-bold text-ink-900">
                  {formatPrice(it.price * it.quantity)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[15px] font-bold text-ink-900">
            Доставка и оплата
          </h2>
          <div className="space-y-2 rounded-2xl border border-ink-200 p-4 text-[14px]">
            <Row label="Получатель" value={order.customerName} />
            <Row label="Телефон" value={order.customerPhone} />
            <Row label="Адрес" value={order.address} icon={<MapPin size={14} />} />
            {order.comment && <Row label="Комментарий" value={order.comment} />}
            <Row
              label="Оплата"
              value={
                order.payment === "cash"
                  ? PAYMENT_LABELS.cash
                  : PAYMENT_LABELS.card
              }
            />
          </div>
        </section>

        <section>
          <div className="rounded-2xl bg-ink-50 p-4 space-y-1.5">
            <Row label="Товары" value={formatPrice(order.subtotal)} />
            <Row label="Доставка" value={formatPrice(order.deliveryFee)} />
            <div className="my-2 border-t border-ink-200" />
            <Row label="Итого" value={formatPrice(order.total)} bold />
          </div>
        </section>

        <Badge tone="info">
          Статус: {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>
    </PageShell>
  );
}

function Row({
  label,
  value,
  bold,
  icon,
}: {
  label: string;
  value: string;
  bold?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span
        className={cn(
          "flex items-center gap-1.5 text-ink-600",
          bold && "text-[15px] font-semibold text-ink-900"
        )}
      >
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "text-right",
          bold ? "text-[18px] font-extrabold text-ink-900" : "text-ink-900"
        )}
      >
        {value}
      </span>
    </div>
  );
}
