"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { SearchBar } from "@/components/catalog/SearchBar";
import { SourceTabs } from "@/components/catalog/SourceTabs";
import { CategoryGrid } from "@/components/catalog/CategoryGrid";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { WeeklyBanner } from "@/components/catalog/WeeklyBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Store } from "lucide-react";
import type { Category, Product, Shop, SourceType } from "@/lib/types";
import Link from "next/link";

type Props = {
  categories: Category[];
  shops: Shop[];
  products: Product[];
};

export function HomeView({ categories, shops, products }: Props) {
  const [source, setSource] = useState<SourceType>("market");

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.source === source),
    [categories, source]
  );
  const visibleShops = useMemo(
    () => shops.filter((s) => s.source === source),
    [shops, source]
  );
  const visibleProducts = useMemo(
    () => products.filter((p) => p.source === source),
    [products, source]
  );
  const weekly = useMemo(
    () => products.filter((p) => p.isWeekly),
    [products]
  );

  return (
    <PageShell>
      <Header variant="home" />
      <div className="px-4 pt-2 pb-4 space-y-5">
        <SearchBar asLink />

        <SourceTabs active={source} onChange={setSource} />

        {weekly.length > 0 && <WeeklyBanner count={weekly.length} />}

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[18px] font-bold text-ink-900">Категории</h2>
            <span className="text-[12px] text-ink-500">
              {visibleCategories.length} разделов
            </span>
          </div>
          {visibleCategories.length > 0 ? (
            <CategoryGrid items={visibleCategories} />
          ) : (
            <EmptyState icon={Store} title="Категории пока не добавлены" />
          )}
        </section>

        {source === "shop" && (
          <section>
            <h2 className="mb-3 text-[18px] font-bold text-ink-900">Лавки</h2>
            {visibleShops.length === 0 ? (
              <EmptyState icon={Store} title="Лавки пока не добавлены" />
            ) : (
              <ul className="space-y-3">
                {visibleShops.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/shop/${s.slug}`}
                      className="flex items-center justify-between rounded-2xl bg-ink-50 p-4 hover:bg-ink-100"
                    >
                      <div>
                        <div className="text-[15px] font-semibold text-ink-900">
                          {s.name}
                        </div>
                        {s.description && (
                          <div className="mt-0.5 text-[12px] text-ink-500">
                            {s.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {visibleProducts.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-[18px] font-bold text-ink-900">
                {source === "food"
                  ? "Хиты от кафе и ресторанов"
                  : "Популярное на рынке"}
              </h2>
              <span className="text-[12px] text-ink-500">
                {visibleProducts.length}
              </span>
            </div>
            <ProductGrid products={visibleProducts.slice(0, 8)} />
          </section>
        )}

      </div>
    </PageShell>
  );
}
