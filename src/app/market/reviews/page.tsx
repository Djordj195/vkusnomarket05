import Link from "next/link";
import { ArrowLeft, MessageCircleHeart, Plus, Star } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import { listApprovedFeedback } from "@/server/feedback-store";
import { listAllApprovedReviews } from "@/server/reviews-store";

export const dynamic = "force-dynamic";

export const metadata = { title: "Отзывы клиентов" };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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

export default async function ReviewsPage() {
  const [feedbacks, reviews] = await Promise.all([
    listApprovedFeedback(100),
    listAllApprovedReviews(100),
  ]);

  // Merge feedback (no stars) and reviews (with stars) into a single list
  type MergedReview = {
    id: string;
    createdAt: string;
    name: string;
    message: string;
    rating?: number;
    targetLabel?: string;
  };

  const merged: MergedReview[] = [
    ...feedbacks.map((f) => ({
      id: f.id,
      createdAt: f.createdAt,
      name: f.name,
      message: f.message,
    })),
    ...reviews.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      name: r.userName,
      message: r.comment,
      rating: r.rating,
      targetLabel:
        r.targetType === "product" ? "Товар" : "Магазин",
    })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <PageShell className="bg-white">
      <header
        className="sticky top-0 z-10 border-b border-ink-100 bg-white/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <Link
            href="/market"
            aria-label="На главную"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-ink-700 hover:bg-ink-200"
          >
            <ArrowLeft size={18} />
          </Link>
          <BrandPill />
          <Link
            href="/market/feedback"
            aria-label="Оставить отзыв"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
          >
            <Plus size={18} />
          </Link>
        </div>
      </header>

      <div className="px-4 pt-5">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-brand-600">
          <MessageCircleHeart size={14} />
          Отзывы клиентов
        </div>
        <h1 className="mt-1 text-[26px] font-extrabold text-ink-900">
          Что говорят покупатели
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Только опубликованные отзывы. Хотите оставить свой?
          <Link
            href="/market/feedback"
            className="ml-1 font-semibold text-brand-600 hover:underline"
          >
            Написать отзыв
          </Link>
        </p>
      </div>

      <div className="px-4 mt-5 pb-8 space-y-3">
        {merged.length === 0 ? (
          <div className="rounded-3xl bg-ink-100 p-6 text-center text-[14px] text-ink-500">
            Пока нет опубликованных отзывов.
            <br />
            Будьте первым — нажмите «Написать отзыв».
          </div>
        ) : (
          merged.map((r) => {
            const initials = (r.name || "Гость")
              .trim()
              .split(/\s+/)
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <article
                key={r.id}
                className="rounded-3xl bg-ink-50 p-4 card-shadow"
              >
                {r.rating ? (
                  <div className="mb-1.5 flex items-center gap-2">
                    <Stars rating={r.rating} />
                    {r.targetLabel && (
                      <span className="text-[11px] text-ink-400">
                        {r.targetLabel}
                      </span>
                    )}
                  </div>
                ) : null}
                {r.message && (
                  <p className="text-[15px] leading-snug text-ink-900 whitespace-pre-line">
                    {r.message}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-[12px] font-extrabold text-white">
                    {initials || "В"}
                  </span>
                  <div className="leading-tight">
                    <div className="text-[13px] font-semibold text-ink-900">
                      {r.name?.trim() || "Гость"}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      {formatDate(r.createdAt)}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
