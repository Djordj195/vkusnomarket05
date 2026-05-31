import { Star } from "lucide-react";
import type { PublicReview } from "@/server/reviews-store";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
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

export function ReviewsList({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl bg-ink-50 p-5 text-center text-[13px] text-ink-500">
        Пока нет отзывов. Будьте первым!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => {
        const initials = (r.userName || "Г")
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
            className="rounded-2xl border border-ink-100 bg-white p-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-[11px] font-extrabold text-white">
                {initials || "Г"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-ink-900">
                  {r.userName?.trim() || "Гость"}
                </div>
                <div className="text-[11px] text-ink-500">
                  {formatDate(r.createdAt)}
                </div>
              </div>
              <Stars rating={r.rating} />
            </div>
            {r.comment && (
              <p className="mt-2 whitespace-pre-line text-[14px] leading-snug text-ink-800">
                {r.comment}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
