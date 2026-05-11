import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { City } from "@/lib/types";

/**
 * Карточка-заглушка для городов со статусом coming_soon — показывается, если
 * пользователь выбрал город, где ВКУСНОМАРКЕТ ещё не запустился.
 */
export function CityComingSoonNotice({ city }: { city: City }) {
  return (
    <section className="px-4">
      <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-4 text-brand-900 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold leading-tight">
              {city.name} — скоро откроемся
            </h3>
            <p className="mt-1 text-[13px] leading-snug text-brand-800/90">
              Пока в этом городе нет подключённых продавцов. Мы выбираем
              партнёров: кафе, магазины, аптеки и хозтовары.
            </p>
            <Link
              href="/vendor/signup"
              className="mt-3 inline-flex items-center rounded-xl bg-brand-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-brand-700"
            >
              Стать продавцом в {city.name}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
