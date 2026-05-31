import { Star } from "lucide-react";
import { listReviewsForAdmin } from "@/server/reviews-store";
import type { ReviewStatus } from "@/server/reviews-store";
import {
  approveReviewAction,
  rejectReviewAction,
  deleteReviewAction,
} from "@/server/reviews-actions";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string }>;

const TABS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "pending", label: "На модерации" },
  { value: "approved", label: "Опубликованные" },
  { value: "rejected", label: "Скрытые" },
  { value: "all", label: "Все" },
];

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "На модерации",
  approved: "Опубликован",
  rejected: "Скрыт",
};

const TARGET_LABELS: Record<string, string> = {
  product: "Товар",
  shop: "Магазин",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-ink-300"
          }
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rawStatus = sp.status ?? "pending";
  const status: ReviewStatus | "all" =
    rawStatus === "approved" ||
    rawStatus === "rejected" ||
    rawStatus === "all" ||
    rawStatus === "pending"
      ? rawStatus
      : "pending";

  const items = await listReviewsForAdmin(status);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Отзывы с рейтингами
        </h1>
        <p className="text-[13px] text-ink-500">
          Отзывы с оценками на товары и магазины. Опубликованные видны
          покупателям.
        </p>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = t.value === status;
          return (
            <Link
              key={t.value}
              href={
                t.value === "pending"
                  ? "/admin/reviews"
                  : `/admin/reviews?status=${t.value}`
              }
              className={
                active
                  ? "rounded-full bg-brand-600 px-3.5 py-1.5 text-[12px] font-semibold text-white"
                  : "rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-ink-50"
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white py-12 text-center">
          <Star size={28} className="text-ink-400" />
          <h2 className="mt-3 text-[15px] font-bold text-ink-900">
            Здесь пусто
          </h2>
          <p className="mt-1 max-w-xs px-4 text-[12px] text-ink-500">
            Когда клиенты оставят отзыв с оценкой, он появится здесь
            на модерации.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-ink-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-ink-900">
                    {r.userName?.trim() || "Аноним"}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-500">
                    <span>{formatDate(r.createdAt)}</span>
                    <span className="text-ink-300">·</span>
                    <span>{TARGET_LABELS[r.targetType] ?? r.targetType}</span>
                    <span className="text-ink-300">·</span>
                    <span className="truncate max-w-[120px]">{r.targetId}</span>
                  </div>
                </div>
                <Badge
                  tone={
                    r.status === "approved"
                      ? "brand"
                      : r.status === "rejected"
                      ? "neutral"
                      : "warn"
                  }
                >
                  {STATUS_LABELS[r.status]}
                </Badge>
              </div>

              <div className="mt-2">
                <Stars rating={r.rating} />
              </div>

              {r.comment && (
                <p className="mt-2 whitespace-pre-line rounded-xl bg-ink-50 p-3 text-[14px] leading-snug text-ink-900">
                  {r.comment}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {r.status !== "approved" && (
                  <form action={approveReviewAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-700"
                    >
                      Опубликовать
                    </button>
                  </form>
                )}
                {r.status !== "rejected" && (
                  <form action={rejectReviewAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-ink-50"
                    >
                      Скрыть
                    </button>
                  </form>
                )}
                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-50"
                  >
                    Удалить
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
