"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RepeatOrderButton } from "@/components/orders/RepeatOrderButton";
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

export function OrdersView() {
  const orders = useOrders((s) => s.orders);
  const params = useSearchParams();
  const groupId = params?.get("group") ?? null;
  const isNew = params?.get("new") === "1";

  // Если пришли с чек-аута и в URL есть group — показываем сводку «Создано N заказов»
  const groupOrders = useMemo<Order[] | null>(() => {
    if (!groupId) return null;
    return orders.filter((o) => o.checkoutGroupId === groupId);
  }, [groupId, orders]);

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

      {isNew && groupOrders && groupOrders.length > 0 && (
        <div className="mx-4 mt-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-brand-600"
            />
            <div>
              <div className="text-[14px] font-bold text-ink-900">
                Создано {groupOrders.length} заказа
              </div>
              <div className="mt-0.5 text-[12px] text-ink-700">
                Каждый продавец готовит и доставляет свою часть отдельно. Статусы
                обновляются по каждому заказу самостоятельно.
              </div>
            </div>
          </div>
        </div>
      )}

      <ul className="px-4 pt-3 pb-4 space-y-3">
        {orders.map((order: Order) => {
          const highlightGroup =
            groupId && order.checkoutGroupId === groupId;
          return (
            <li
              key={order.id}
              className={
                highlightGroup
                  ? "rounded-2xl border border-brand-300 bg-brand-50 p-4"
                  : "rounded-2xl border border-ink-200 p-4 hover:bg-ink-50"
              }
            >
              <Link href={`/orders/${order.id}`} className="block">
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
              <div className="mt-3">
                <RepeatOrderButton
                  order={order}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center bg-brand-50 text-brand-700 hover:bg-brand-100"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
