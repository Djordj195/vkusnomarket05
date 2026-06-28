"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ClipboardList, CreditCard, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RepeatOrderButton } from "@/components/orders/RepeatOrderButton";
import { useOrders } from "@/store/orders";
import { formatDate, formatPrice, pluralize } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/types";
import {
  refreshPaymentForGroupAction,
} from "@/server/payments/payments-client-actions";

const statusTone: Record<OrderStatus, "warn" | "info" | "accent" | "success" | "danger"> = {
  accepted: "info",
  preparing: "warn",
  courier: "accent",
  delivered: "success",
  cancelled: "danger",
};

export function OrdersView() {
  const orders = useOrders((s) => s.orders);
  const upsertOrder = useOrders((s) => s.upsert);
  const params = useSearchParams();
  const groupId = params?.get("group") ?? null;
  const isNew = params?.get("new") === "1";
  const payReturn = params?.get("pay") === "return";

  // Если пришли с чек-аута и в URL есть group — показываем сводку «Создано N заказов»
  const groupOrders = useMemo<Order[] | null>(() => {
    if (!groupId) return null;
    return orders.filter((o) => o.checkoutGroupId === groupId);
  }, [groupId, orders]);

  // Phase 8: после возврата с ЮKassa подтягиваем статус платежа и
  // обновляем зеркальный paymentStatus у локальных заказов.
  const [payStatus, setPayStatus] = useState<PaymentStatus | null>(null);
  useEffect(() => {
    if (!payReturn || !groupId) return;
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      const res = await refreshPaymentForGroupAction(groupId);
      if (cancelled) return;
      if (res.ok && res.payment) {
        setPayStatus(res.payment.status);
        for (const o of res.orders ?? []) {
          upsertOrder(o);
        }
        if (
          res.payment.status === "succeeded" ||
          res.payment.status === "canceled" ||
          attempts >= 10
        )
          return;
      }
      setTimeout(poll, 2000);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [payReturn, groupId, upsertOrder]);

  if (orders.length === 0) {
    return (
      <PageShell>
        <Header variant="page" title="Заказы" showBack={false} />
        <EmptyState
          icon={ClipboardList}
          title="У вас пока нет заказов"
          description="Оформите первый заказ — здесь появятся история и статусы."
          action={
            <Link href="/market">
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

      {payReturn && (
        <div className="mx-4 mt-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-start gap-2">
            {payStatus === "succeeded" ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-brand-600" />
            ) : payStatus === "canceled" ? (
              <CreditCard size={20} className="mt-0.5 shrink-0 text-rose-600" />
            ) : (
              <Loader2
                size={20}
                className="mt-0.5 shrink-0 animate-spin text-brand-600"
              />
            )}
            <div>
              <div className="text-[14px] font-bold text-ink-900">
                {payStatus === "succeeded"
                  ? "Оплата прошла"
                  : payStatus === "canceled"
                    ? "Оплата отменена"
                    : "Подтверждаем оплату…"}
              </div>
              <div className="mt-0.5 text-[12px] text-ink-700">
                {payStatus === "succeeded"
                  ? "Чек 54-ФЗ отправлен на ваш телефон. Заказ передан продавцу."
                  : payStatus === "canceled"
                    ? "Платёж не прошёл. Заказ можно оплатить наличными при доставке или повторить попытку."
                    : "Это может занять до 30 секунд."}
              </div>
            </div>
          </div>
        </div>
      )}

      {isNew && groupOrders && groupOrders.length > 0 && (
        <div className="mx-4 mt-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-brand-600"
            />
            <div>
              <div className="text-[14px] font-bold text-ink-900">
                Создано {groupOrders.length} {pluralize(groupOrders.length, ["заказ", "заказа", "заказов"])}
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
              <Link href={`/market/orders/${order.id}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[12px] text-ink-500">
                      Заказ № {order.number}
                    </div>
                    <div className="mt-0.5 text-[14px] font-semibold text-ink-900">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={statusTone[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    {order.paymentStatus && (
                      <Badge
                        tone={
                          order.paymentStatus === "succeeded"
                            ? "success"
                            : order.paymentStatus === "canceled" ||
                                order.paymentStatus === "refunded"
                              ? "danger"
                              : "warn"
                        }
                      >
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[13px] text-ink-500">
                    {order.items.length} {pluralize(order.items.length, ["товар", "товара", "товаров"])}
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
