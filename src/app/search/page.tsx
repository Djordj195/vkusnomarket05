"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search } from "lucide-react";
import { searchProducts } from "@/data/products";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchProducts(query), [query]);

  return (
    <PageShell>
      <Header variant="page" title="Поиск" />
      <div className="px-4 pt-2 pb-4 space-y-4">
        <div
          className="flex h-12 w-full items-center gap-2 rounded-2xl bg-ink-100 px-4 text-[14px] text-ink-700 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-200"
        >
          <Search size={18} className="text-ink-500" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Помидоры, шашлык, лаваш..."
            className="flex-1 bg-transparent outline-none placeholder:text-ink-500"
          />
        </div>
        {query.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Что ищем?"
            description="Введите название товара, например «помидоры», «шашлык» или «лаваш»."
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Ничего не нашли"
            description={`По запросу «${query}» товаров пока нет.`}
          />
        ) : (
          <>
            <p className="text-[12px] text-ink-500">
              Найдено: {results.length}
            </p>
            <ProductGrid products={results} />
          </>
        )}
      </div>
    </PageShell>
  );
}
