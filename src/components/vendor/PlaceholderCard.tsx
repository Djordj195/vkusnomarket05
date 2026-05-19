import Link from "next/link";
import { FileText, ChevronLeft } from "lucide-react";

/**
 * Универсальный плейсхолдер для разделов, по которым данные ещё не
 * наполнены. Используется во всех кабинетах (продавца, курьера и т.п.),
 * чтобы переход всегда вёл на содержательную страницу, а не на 404 или
 * мёртвую кнопку.
 */
export function PlaceholderCard({
  title,
  description,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">
        <FileText size={22} />
      </div>
      <h2 className="mt-3 text-[15px] font-bold text-ink-900">
        {title ?? "Данные в обработке"}
      </h2>
      <p className="mt-1 text-[12px] text-ink-500">
        {description ??
          "Раздел готовится. После настройки данные появятся здесь."}
      </p>
      {(ctaHref || secondaryHref) && (
        <div className="mt-4 flex justify-center gap-2">
          {ctaHref && (
            <Link
              href={ctaHref}
              className="rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-brand-700"
            >
              {ctaLabel ?? "Перейти"}
            </Link>
          )}
          {secondaryHref && (
            <Link
              href={secondaryHref}
              className="rounded-xl bg-white px-3 py-2 text-[12px] font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
            >
              {secondaryLabel ?? "Назад"}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function SubpageHeader({
  title,
  backHref = "/vendor/dashboard",
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={backHref}
        aria-label="Назад"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
      >
        <ChevronLeft size={22} />
      </Link>
      <h1 className="text-[22px] font-extrabold text-ink-900">{title}</h1>
    </div>
  );
}
