import Link from "next/link";
import { Quote, ArrowRight, MessageCircleHeart } from "lucide-react";
import type { ApprovedFeedback } from "@/server/feedback-store";

type Props = {
  items: ApprovedFeedback[];
  total: number;
};

function pluralize(n: number): string {
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return "отзывов";
  if (m10 === 1) return "отзыв";
  if (m10 >= 2 && m10 <= 4) return "отзыва";
  return "отзывов";
}

export function FeedbackHomeCard({ items, total }: Props) {
  if (items.length === 0) return null;
  const featured = items[0];
  const initials = (featured.name || "Гость")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="px-4">
      <Link
        href="/market/reviews"
        aria-label="Все отзывы клиентов"
        className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 p-5 text-white card-shadow"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 -right-4 h-32 w-32 rounded-full bg-accent-300/30 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/10 blur-2xl"
        />

        <div className="relative flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-brand-100">
          <MessageCircleHeart size={14} />
          Отзывы клиентов
        </div>

        <div className="relative mt-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <Quote
            size={18}
            className="absolute -top-2.5 -left-1 text-accent-300"
            strokeWidth={2.4}
          />
          <p className="text-[14px] leading-snug text-white">
            {featured.message.length > 160
              ? `${featured.message.slice(0, 158)}…`
              : featured.message}
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-300 text-[12px] font-extrabold text-ink-900">
              {initials || "В"}
            </span>
            <div className="text-[12px] font-medium text-brand-100">
              {featured.name?.trim() || "Гость"}
            </div>
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-white">
            {total} {pluralize(total)} от клиентов
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-semibold backdrop-blur-md transition group-hover:bg-white/25">
            Читать все
            <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </section>
  );
}
