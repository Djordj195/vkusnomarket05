import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  PROMO_CODE_KIND_LABELS,
  type PromoCode,
} from "@/lib/types";
import { listPromos } from "@/server/promo/promo-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Промокоды · Админка",
};

function formatValue(p: PromoCode): string {
  if (p.kind === "percent") return `${p.value}%`;
  if (p.kind === "fixed") return `−${formatPrice(p.value)}`;
  return "доставка";
}

function statusBadge(p: PromoCode): { tone: "success" | "warn" | "danger"; label: string } {
  if (!p.active) return { tone: "danger", label: "Выключен" };
  const now = Date.now();
  if (p.validUntil && new Date(p.validUntil).getTime() < now) {
    return { tone: "danger", label: "Истёк" };
  }
  if (p.validFrom && new Date(p.validFrom).getTime() > now) {
    return { tone: "warn", label: "Ещё не активен" };
  }
  if (p.usageLimit > 0 && p.usedCount >= p.usageLimit) {
    return { tone: "danger", label: "Исчерпан" };
  }
  return { tone: "success", label: "Активен" };
}

export default async function AdminPromoListPage() {
  const promos = await listPromos();

  const active = promos.filter((p) => statusBadge(p).label === "Активен").length;
  const totalDiscount = promos.reduce((s, p) => s + p.totalDiscount, 0);
  const totalUses = promos.reduce((s, p) => s + p.usedCount, 0);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold leading-tight text-ink-900">
            Промокоды
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Скидки и купоны для клиентов. Применяются на этапе подтверждения
            заказа.
          </p>
        </div>
        <Link href="/admin/promo/new">
          <Button size="md">
            <Plus className="size-4" />
            Создать
          </Button>
        </Link>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <StatTile label="Активных" value={String(active)} tone="brand" />
        <StatTile label="Применений" value={String(totalUses)} tone="info" />
        <StatTile
          label="Сумма скидок"
          value={formatPrice(totalDiscount)}
          tone="accent"
        />
      </section>

      {promos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-[13px] text-ink-500">
          <Tag className="mx-auto mb-2 size-6 text-ink-400" />
          Нет промокодов. Создайте первый — он появится в форме оформления
          заказа клиента.
        </div>
      ) : (
        <ul className="space-y-2">
          {promos.map((p) => {
            const s = statusBadge(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/promo/${p.id}`}
                  className="block rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[14px] font-bold text-ink-900">
                          {p.code}
                        </span>
                        <Badge tone={s.tone}>{s.label}</Badge>
                        <Badge tone="neutral">
                          {PROMO_CODE_KIND_LABELS[p.kind]}
                        </Badge>
                        <Badge tone="brand">{formatValue(p)}</Badge>
                      </div>
                      {p.description && (
                        <div className="mt-1 text-[12px] text-ink-600">
                          {p.description}
                        </div>
                      )}
                      <div className="mt-1 text-[11px] text-ink-500">
                        Использовано: {p.usedCount}
                        {p.usageLimit > 0 ? ` / ${p.usageLimit}` : ""}
                        {p.totalDiscount > 0
                          ? ` · скидок ${formatPrice(p.totalDiscount)}`
                          : ""}
                        {p.validUntil
                          ? ` · до ${formatDate(p.validUntil)}`
                          : ""}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "brand" | "accent" | "info";
}) {
  const toneClass =
    tone === "brand"
      ? "bg-brand-50 text-brand-700"
      : tone === "info"
        ? "bg-sky-50 text-sky-700"
        : "bg-accent-50 text-accent-700";
  return (
    <div className={`rounded-2xl p-3 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-extrabold leading-tight">
        {value}
      </div>
    </div>
  );
}
