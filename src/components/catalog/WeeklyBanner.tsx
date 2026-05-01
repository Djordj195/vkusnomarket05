import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function WeeklyBanner({ count }: { count: number }) {
  return (
    <Link
      href="/weekly"
      className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-4 text-white shadow-md shadow-brand-600/25"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-brand-100">
          <Sparkles size={14} />
          Товары недели
        </div>
        <div className="mt-1 text-[18px] font-bold leading-tight">
          Лучшие цены и свежесть
        </div>
        <div className="mt-1 text-[12px] text-brand-100">
          {count} {pluralize(count)} со скидкой и от поставщиков
        </div>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
        <ArrowRight size={20} />
      </div>
    </Link>
  );
}

function pluralize(n: number): string {
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return "товаров";
  if (m10 === 1) return "товар";
  if (m10 >= 2 && m10 <= 4) return "товара";
  return "товаров";
}
