import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatPrice } from "@/lib/utils";
import { PROMO_CODE_KIND_LABELS } from "@/lib/types";
import {
  getPromoById,
  listRedemptionsForPromo,
} from "@/server/promo/promo-store";
import { listVendors } from "@/server/vendors-store";
import { listCategories } from "@/server/categories-store";
import { PromoForm } from "../PromoForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Промокод · Админка",
};

export default async function PromoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [promo, vendors, categories, redemptions] = await Promise.all([
    getPromoById(id),
    listVendors(),
    listCategories(),
    listRedemptionsForPromo(id),
  ]);
  if (!promo) notFound();

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <Link
          href="/admin/promo"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline"
        >
          <ChevronLeft className="size-4" />К списку промокодов
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-[22px] font-extrabold leading-tight text-ink-900">
            {promo.code}
          </h1>
          <Badge tone={promo.active ? "success" : "danger"}>
            {promo.active ? "Активен" : "Выключен"}
          </Badge>
          <Badge tone="brand">{PROMO_CODE_KIND_LABELS[promo.kind]}</Badge>
        </div>
        {promo.description && (
          <p className="text-[13px] text-ink-600">{promo.description}</p>
        )}
      </header>

      <section className="grid grid-cols-3 gap-2">
        <Tile
          label="Использований"
          value={
            promo.usageLimit > 0
              ? `${promo.usedCount} / ${promo.usageLimit}`
              : String(promo.usedCount)
          }
        />
        <Tile label="Сумма скидок" value={formatPrice(promo.totalDiscount)} />
        <Tile
          label="Действителен до"
          value={promo.validUntil ? formatDate(promo.validUntil) : "—"}
        />
      </section>

      <PromoForm
        promo={promo}
        vendors={vendors.map((v) => ({ id: v.id, brandName: v.brandName }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="mb-3 text-[15px] font-bold text-ink-900">
          Журнал применений ({redemptions.length})
        </h2>
        {redemptions.length === 0 ? (
          <div className="rounded-xl bg-ink-50 p-3 text-center text-[12px] text-ink-500">
            Пока никто не применял этот промокод.
          </div>
        ) : (
          <ul className="space-y-2">
            {redemptions.slice(0, 50).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 text-[12px]"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-ink-900">
                    {r.customerName || r.customerPhone}
                  </div>
                  <div className="text-ink-500">
                    {formatDate(r.createdAt)} · подытог{" "}
                    {formatPrice(r.subtotal)}
                    {r.orderId ? ` · заказ ${r.orderId.slice(-6)}` : ""}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-emerald-700">
                    −{formatPrice(r.discountAmount)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
        {label}
      </div>
      <div className="mt-1 text-[16px] font-extrabold leading-tight">
        {value}
      </div>
    </div>
  );
}
