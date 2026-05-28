import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getPaymentById } from "@/server/payments/payments-store";
import { listOrdersByCheckoutGroup } from "@/server/orders-store";
import {
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
} from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { RefundForm } from "./RefundForm";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<
  PaymentStatus,
  "warn" | "info" | "success" | "danger"
> = {
  pending: "warn",
  waiting_for_capture: "info",
  succeeded: "success",
  canceled: "danger",
  refunded: "danger",
  partially_refunded: "warn",
};

export default async function AdminPaymentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payment = await getPaymentById(id);
  if (!payment) notFound();
  const orders = await listOrdersByCheckoutGroup(payment.checkoutGroupId);

  const remainingKop = payment.amountKop - payment.refundedKop;
  const canRefund =
    (payment.status === "succeeded" || payment.status === "partially_refunded") &&
    remainingKop > 0;

  return (
    <div className="space-y-4">
      <Link
        href="/admin/payments"
        className="inline-flex items-center gap-1 text-[12px] text-ink-500 hover:text-ink-700"
      >
        <ArrowLeft size={14} /> К списку
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-ink-900">
            {formatPrice(Math.round(payment.amountKop / 100))}
          </h1>
          <div className="mt-1 text-[12px] text-ink-500">
            <code>{payment.id}</code> · {formatDate(payment.createdAt)}
          </div>
        </div>
        <Badge tone={STATUS_TONE[payment.status]}>
          {PAYMENT_STATUS_LABELS[payment.status]}
        </Badge>
      </header>

      <section className="rounded-2xl border border-ink-200 bg-white p-4 text-[13px]">
        <Row label="Провайдер" value={payment.provider} />
        <Row
          label="ID платежа провайдера"
          value={payment.providerPaymentId ?? "—"}
        />
        <Row
          label="Idempotency-Key"
          value={payment.idempotencyKey ?? "—"}
        />
        <Row label="Валюта" value={payment.currency} />
        <Row
          label="Возвращено"
          value={formatPrice(Math.round(payment.refundedKop / 100))}
        />
        <Row
          label="Осталось к возврату"
          value={formatPrice(Math.round(remainingKop / 100))}
        />
        <Row
          label="Телефон клиента"
          value={payment.customerPhone ?? "—"}
        />
        <Row label="Email клиента" value={payment.customerEmail ?? "—"} />
        <Row
          label="checkout_group_id"
          value={<code>{payment.checkoutGroupId}</code>}
        />
      </section>

      {canRefund && <RefundForm paymentId={payment.id} maxKop={remainingKop} />}

      {payment.refunds.length > 0 && (
        <section className="rounded-2xl border border-ink-200 bg-white p-4">
          <h2 className="text-[14px] font-bold text-ink-900">Возвраты</h2>
          <ul className="mt-2 space-y-2 text-[12px]">
            {payment.refunds.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between border-b border-ink-100 pb-2 last:border-0"
              >
                <div>
                  <div className="font-semibold text-ink-900">
                    {formatPrice(Math.round(r.amountKop / 100))}
                  </div>
                  <div className="text-ink-500">{formatDate(r.createdAt)}</div>
                  {r.reason && (
                    <div className="text-ink-500">«{r.reason}»</div>
                  )}
                </div>
                <code className="text-[10px] text-ink-500">{r.id}</code>
              </li>
            ))}
          </ul>
        </section>
      )}

      {payment.receipt && (
        <section className="rounded-2xl border border-ink-200 bg-white p-4">
          <h2 className="text-[14px] font-bold text-ink-900">Чек 54-ФЗ</h2>
          <p className="mt-1 text-[11px] text-ink-500">
            Передан в ОФД через ЮKassa в момент создания платежа.
          </p>
          <ul className="mt-2 space-y-1 text-[12px]">
            {payment.receipt.items.map((it, idx) => (
              <li key={idx} className="flex justify-between gap-2">
                <span className="truncate text-ink-700">
                  {it.description} × {it.quantity}
                </span>
                <span className="font-semibold text-ink-900">
                  {formatPrice(Math.round((it.amountKop * it.quantity) / 100))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[14px] font-bold text-ink-900">
          Связанные заказы ({orders.length})
        </h2>
        <ul className="mt-2 space-y-2 text-[13px]">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between rounded-xl border border-ink-100 p-2 hover:bg-ink-50"
              >
                <span>№ {o.number}</span>
                <span className="font-semibold">
                  {formatPrice(o.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-100 py-1.5 last:border-0">
      <span className="text-ink-500">{label}</span>
      <span className="text-right text-ink-900">{value}</span>
    </div>
  );
}
