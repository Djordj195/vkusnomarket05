"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import { Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { SOURCE_SHORT_LABELS } from "@/lib/types";
import { setProductWeeklyAction } from "@/server/products-actions";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Props = {
  products: Product[];
  categories: Category[];
  dbConfigured: boolean;
};

export function WeeklyManager({ products, categories, dbConfigured }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const weekly = useMemo(
    () => products.filter((p) => p.isWeekly),
    [products]
  );

  const candidates = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return products
      .filter((p) => !p.isWeekly)
      .filter((p) => {
        if (!q) return true;
        const cat = categoryMap.get(p.categoryId);
        return (
          p.name.toLowerCase().includes(q) ||
          (cat?.name?.toLowerCase().includes(q) ?? false)
        );
      });
  }, [products, deferredQuery, categoryMap]);

  function setWeekly(p: Product, isWeekly: boolean) {
    if (!dbConfigured) return;
    setError(null);
    setBusyId(p.id);
    startTransition(async () => {
      const res = await setProductWeeklyAction(p.id, isWeekly);
      if (!res.ok) {
        setError(res.error);
      } else {
        router.refresh();
      }
      setBusyId(null);
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-2xl bg-red-50 p-3 text-[12px] text-red-800">
          {error}
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand-600" />
            <h2 className="text-[15px] font-bold text-ink-900">В разделе</h2>
          </div>
          <span className="text-[12px] font-semibold text-ink-500">
            {weekly.length} {pluralize(weekly.length)}
          </span>
        </div>

        {weekly.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-6 text-center text-[13px] text-ink-500">
            Пока нет ни одного товара недели. Добавьте товары из списка ниже.
          </div>
        ) : (
          <ul className="space-y-2">
            {weekly.map((p) => {
              const cat = categoryMap.get(p.categoryId);
              const busy = busyId === p.id && pending;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-3"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-ink-900">
                      {p.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                      <Badge tone="brand">
                        {SOURCE_SHORT_LABELS[p.source]}
                      </Badge>
                      <span className="truncate">{cat?.name ?? "—"}</span>
                      <span>· {formatPrice(p.price)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeekly(p, false)}
                    disabled={!dbConfigured || busy}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-red-50 px-3 text-[12px] font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Убрать из товаров недели"
                  >
                    <Trash2 size={14} />
                    {busy ? "..." : "Убрать"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink-900">
            Добавить из каталога
          </h2>
          <span className="text-[12px] font-semibold text-ink-500">
            {candidates.length}
          </span>
        </div>

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

        {candidates.length === 0 ? (
          <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center text-[13px] text-ink-500">
            {products.filter((p) => !p.isWeekly).length === 0
              ? "Все товары уже в разделе."
              : `Ничего не найдено по запросу «${deferredQuery}».`}
          </div>
        ) : (
          <ul className="space-y-2">
            {candidates.map((p) => {
              const cat = categoryMap.get(p.categoryId);
              const busy = busyId === p.id && pending;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-ink-900">
                      {p.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                      <Badge tone="brand">
                        {SOURCE_SHORT_LABELS[p.source]}
                      </Badge>
                      <span className="truncate">{cat?.name ?? "—"}</span>
                      <span>· {formatPrice(p.price)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeekly(p, true)}
                    disabled={!dbConfigured || busy}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 px-3 text-[12px] font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Добавить в товары недели"
                  >
                    <Plus size={14} />
                    {busy ? "..." : "Добавить"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
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
