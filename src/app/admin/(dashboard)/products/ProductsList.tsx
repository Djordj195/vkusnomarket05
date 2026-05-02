"use client";

import Image from "next/image";
import { useDeferredValue, useMemo, useState } from "react";
import { Heart, Search, Star, X } from "lucide-react";
import type { Product, Category } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { cn, formatPrice } from "@/lib/utils";
import { SOURCE_SHORT_LABELS } from "@/lib/types";
import { useAdminFavorites } from "@/store/admin-favorites";

type Props = {
  products: Product[];
  categories: Category[];
};

export function ProductsList({ products, categories }: Props) {
  const [query, setQuery] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const favIds = useAdminFavorites((s) => s.ids);
  const toggleFav = useAdminFavorites((s) => s.toggle);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (onlyFav && !favIds.includes(p.id)) return false;
      if (!q) return true;
      const cat = categoryMap.get(p.categoryId);
      return (
        p.name.toLowerCase().includes(q) ||
        (cat?.name?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, deferredQuery, categoryMap, onlyFav, favIds]);

  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">Поиск товаров</span>
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию или категории"
          className="w-full rounded-2xl border border-ink-200 bg-white py-2.5 pl-9 pr-9 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Очистить поиск"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-800"
          >
            <X size={14} />
          </button>
        )}
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-500">
        <span>
          Найдено: <strong className="text-ink-900">{filtered.length}</strong>{" "}
          из {products.length}
        </span>
        <button
          type="button"
          onClick={() => setOnlyFav((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
            onlyFav
              ? "border-accent-500 bg-accent-500 text-white"
              : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
          )}
          aria-pressed={onlyFav}
        >
          <Star
            size={12}
            className={cn(onlyFav && "fill-white")}
          />
          Только избранное
          {favIds.length > 0 && (
            <span
              className={cn(
                "ml-0.5 rounded-full px-1.5 py-px text-[10px] font-bold",
                onlyFav ? "bg-white/20 text-white" : "bg-ink-100 text-ink-700"
              )}
            >
              {favIds.length}
            </span>
          )}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center text-[13px] text-ink-500">
          {onlyFav && favIds.length === 0
            ? "В избранном пока пусто. Нажмите на сердечко рядом с товаром, чтобы добавить."
            : `Ничего не найдено по запросу «${deferredQuery}».`}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => {
            const cat = categoryMap.get(p.categoryId);
            const isFav = favIds.includes(p.id);
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-ink-900">
                    {p.name}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                    <Badge tone="brand">{SOURCE_SHORT_LABELS[p.source]}</Badge>
                    <span className="truncate">{cat?.name ?? "—"}</span>
                    <span>· {p.weight}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFav(p.id)}
                    aria-pressed={isFav}
                    aria-label={
                      isFav ? "Убрать из избранного" : "Добавить в избранное"
                    }
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                      isFav
                        ? "border-accent-200 bg-accent-50 text-accent-500"
                        : "border-ink-200 bg-white text-ink-400 hover:bg-ink-50 hover:text-accent-500"
                    )}
                  >
                    <Heart
                      size={16}
                      className={cn(isFav && "fill-accent-500")}
                    />
                  </button>
                  <div className="text-right">
                    <div className="whitespace-nowrap text-[13px] font-extrabold text-ink-900">
                      {formatPrice(p.price)}
                    </div>
                    <div className="text-[10px] text-ink-500">/ {p.unit}</div>
                  </div>
                  {p.inStock ? (
                    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      В наличии
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      Нет
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
