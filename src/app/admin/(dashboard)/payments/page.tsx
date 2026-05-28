import Link from "next/link";
import { Wallet } from "lucide-react";
import { listPayments } from "@/server/payments/payments-store";
import { Badge } from "@/components/ui/Badge";
import {
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
} from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string };

const STATUSES: PaymentStatus[] = [
  "pending",
  "waiting_for_capture",
  "succeeded",
  "canceled",
  "refunded",
  "partially_refunded",
];

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

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filterStatus = STATUSES.includes(sp.status as PaymentStatus)
    ? (sp.status as PaymentStatus)
    : undefined;
  const payments = await listPayments({ status: filterStatus, limit: 200 });

  const totalSucceeded = payments
    .filter((p) => p.status === "succeeded" || p.status === "partially_refunded")
    .reduce((s, p) => s + p.amountKop - p.refundedKop, 0);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Платежи</h1>
        <p className="text-[12px] text-ink-500">
          ЮKassa-платежи и возвраты. Чеки 54-ФЗ передаются ЮKassa в ОФД
          автоматически при создании платежа.
        </p>
      </header>

      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-100 p-3 text-brand-600">
            <Wallet size={20} />
          </div>
          <div>
            <div className="text-[12px] text-ink-500">Поступило (за вычетом возвратов)</div>
            <div className="text-[18px] font-extrabold text-ink-900">
              {formatPrice(Math.round(totalSucceeded / 100))}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 text-[12px]">
        <FilterLink href="/admin/payments" label="Все" active={!filterStatus} />
        {STATUSES.map((s) => (
          <FilterLink
            key={s}
            href={`/admin/payments?status=${s}`}
            label={PAYMENT_STATUS_LABELS[s]}
            active={filterStatus === s}
          />
        ))}
      </nav>

      {payments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 p-6 text-center text-[13px] text-ink-500">
          Платежей пока нет.
        </p>
      ) : (
        <ul className="space-y-2">
          {payments.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/payments/${p.id}`}
                className="block rounded-2xl border border-ink-200 bg-white p-4 hover:border-brand-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-ink-900">
                      {formatPrice(Math.round(p.amountKop / 100))}
                      {p.refundedKop > 0 && (
                        <span className="ml-2 text-[12px] font-normal text-ink-500">
                          возвращено{" "}
                          {formatPrice(Math.round(p.refundedKop / 100))}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-ink-500">
                      {formatDate(p.createdAt)} ·{" "}
                      <code className="text-[10px]">{p.id}</code>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-ink-500">
                      group: <code className="text-[10px]">{p.checkoutGroupId}</code>
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[p.status]}>
                    {PAYMENT_STATUS_LABELS[p.status]}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-brand-600 px-3 py-1 font-semibold text-white"
          : "rounded-full border border-ink-200 px-3 py-1 text-ink-700 hover:bg-ink-50"
      }
    >
      {label}
    </Link>
  );
}
