"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useOrders } from "@/store/orders";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/types";

const statusTone: Record<OrderStatus, "warn" | "info" | "accent" | "success" | "danger"> = {
  accepted: "info",
  preparing: "warn",
  courier: "accent",
  delivered: "success",
  cancelled: "danger",
};

export default function OrdersPage() {
  const orders = useOrders((s) => s.orders);

  if (orders.length === 0) {
    return (
      <PageShell>
        <Header variant="page" title="Заказы" showBack={false} />
        <EmptyState
          icon={ClipboardList}
          title="У вас пока нет заказов"
          description="Оформите первый заказ — здесь появятся история и статусы."
          action={
            <Link href="/">
              <Button variant="primary">Перейти в каталог</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Header variant="page" title="Мои заказы" showBack={false} />
      <ul className="px-4 pt-2 pb-4 space-y-3">
        {orders.map((order: Order) => (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className="block rounded-2xl border border-ink-200 p-4 hover:bg-ink-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[12px] text-ink-500">
                    Заказ № {order.number}
                  </div>
                  <div className="mt-0.5 text-[14px] font-semibold text-ink-900">
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <Badge tone={statusTone[order.status]}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[13px] text-ink-500">
                  {order.items.length} товаров
                </span>
                <span className="text-[15px] font-bold text-ink-900">
                  {formatPrice(order.total)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
