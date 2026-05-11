"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { MapPin, Search, X, Loader2 } from "lucide-react";
import { selectCityAction } from "@/server/cities-actions";
import type { City } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  currentCity: City;
  cities: City[];
  /**
   * "brand" — светлая кнопка для белых шапок;
   * "hero"  — полупрозрачная стеклянная кнопка для тёмных hero-блоков.
   */
  tone?: "brand" | "hero";
};

/**
 * Кнопка-чип «город» в шапке и модалка выбора города.
 * Запоминает выбор в куке (через server action) и перезагружает страницу,
 * чтобы серверные компоненты подтянули новые данные под выбранный город.
 */
export function CityPicker({ currentCity, cities, tone = "brand" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // фокус на поиске при открытии
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setPendingId(null);
  }

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = cities.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
      );
    });

    const active = matches.filter((c) => c.status === "active");
    const coming = matches.filter((c) => c.status === "coming_soon");
    return { active, coming };
  }, [cities, query]);

  function chooseCity(id: string) {
    setPendingId(id);
    const fd = new FormData();
    fd.set("cityId", id);
    startTransition(async () => {
      await selectCityAction(fd);
      close();
      // Перезагружаемся, чтобы RSC перетянул каталог под новый город.
      window.location.reload();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
          tone === "brand"
            ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
            : "bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
        )}
      >
        <MapPin size={14} />
        <span>{currentCity.name}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/60 px-0 sm:px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h2 className="text-[18px] font-bold text-ink-900">Выбор города</h2>
              <button
                type="button"
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-4 pb-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Найти город или регион"
                  className="w-full rounded-xl bg-ink-100 pl-9 pr-3 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
              {grouped.active.length > 0 && (
                <>
                  <h3 className="px-4 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    Доступны для заказа
                  </h3>
                  <ul>
                    {grouped.active.map((c) => (
                      <CityRow
                        key={c.id}
                        city={c}
                        current={c.id === currentCity.id}
                        pending={pendingId === c.id && isPending}
                        onClick={() => chooseCity(c.id)}
                        disabled={isPending}
                      />
                    ))}
                  </ul>
                </>
              )}

              {grouped.coming.length > 0 && (
                <>
                  <h3 className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    Скоро откроемся
                  </h3>
                  <ul>
                    {grouped.coming.map((c) => (
                      <CityRow
                        key={c.id}
                        city={c}
                        current={c.id === currentCity.id}
                        pending={pendingId === c.id && isPending}
                        comingSoon
                        onClick={() => chooseCity(c.id)}
                        disabled={isPending}
                      />
                    ))}
                  </ul>
                </>
              )}

              {grouped.active.length === 0 && grouped.coming.length === 0 && (
                <p className="px-4 py-8 text-center text-[14px] text-ink-500">
                  Ничего не нашли по запросу «{query}»
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CityRow({
  city,
  current,
  pending,
  comingSoon,
  onClick,
  disabled,
}: {
  city: City;
  current: boolean;
  pending: boolean;
  comingSoon?: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 hover:bg-ink-50 transition-colors text-left",
          current && "bg-brand-50/60",
          disabled && "opacity-60 cursor-wait"
        )}
      >
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-[15px] font-medium",
              comingSoon ? "text-ink-700" : "text-ink-900"
            )}
          >
            {city.name}
            {current && (
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                выбран
              </span>
            )}
          </div>
          <div className="text-[12px] text-ink-500 truncate">
            {city.region}
            {comingSoon && (
              <span className="ml-2 text-ink-400">· скоро</span>
            )}
          </div>
        </div>
        {pending && (
          <Loader2 size={16} className="ml-3 animate-spin text-brand-600" />
        )}
      </button>
    </li>
  );
}
