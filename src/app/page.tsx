"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { SearchBar } from "@/components/catalog/SearchBar";
import { SourceTabs } from "@/components/catalog/SourceTabs";
import { CategoryGrid } from "@/components/catalog/CategoryGrid";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { WeeklyBanner } from "@/components/catalog/WeeklyBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Store } from "lucide-react";
import {
  CATEGORIES,
  getCategoriesBySource,
} from "@/data/categories";
import { getShopsBySource } from "@/data/shops";
import {
  PRODUCTS,
  getProductsBySource,
  getWeeklyProducts,
} from "@/data/products";
import type { SourceType } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";
import Link from "next/link";

export default function HomePage() {
  const [source, setSource] = useState<SourceType>("market");

  const categories = getCategoriesBySource(source);
  const shops = getShopsBySource(source);
  const products = getProductsBySource(source);
  const weekly = getWeeklyProducts().filter((p) => p.source === source);

  const totalProducts = PRODUCTS.length;
  const totalCategories = CATEGORIES.length;

  return (
    <PageShell>
      <Header variant="home" />
      <div className="px-4 pt-2 pb-4 space-y-5">
        <SearchBar asLink />

        <SourceTabs active={source} onChange={setSource} />

        <WeeklyBanner count={weekly.length || 5} />

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[18px] font-bold text-ink-900">Категории</h2>
            <span className="text-[12px] text-ink-500">
              {categories.length} разделов
            </span>
          </div>
          {categories.length > 0 ? (
            <CategoryGrid items={categories} />
          ) : (
            <EmptyState
              icon={Store}
              title="Скоро здесь появятся категории"
              description={`В разделе «${SOURCE_LABELS[source]}» пока пусто. Категории добавляются через админ-панель.`}
            />
          )}
        </section>

        {source === "shop" && (
          <section>
            <h2 className="mb-3 text-[18px] font-bold text-ink-900">Лавки</h2>
            {shops.length === 0 ? (
              <EmptyState
                icon={Store}
                title="Лавки пока не добавлены"
                description="Раздел «Лавки» — для частных продавцов. Добавьте первого продавца через админ-панель."
              />
            ) : (
              <ul className="space-y-3">
                {shops.map((s) => (
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

        {products.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-[18px] font-bold text-ink-900">
                {source === "food"
                  ? "Хиты от кафе и ресторанов"
                  : "Популярное на рынке"}
              </h2>
              <span className="text-[12px] text-ink-500">
                {products.length}
              </span>
            </div>
            <ProductGrid products={products.slice(0, 8)} />
          </section>
        )}

        <div className="rounded-2xl bg-brand-50 p-4 text-[12px] leading-snug text-brand-800">
          В каталоге уже {totalProducts} товаров и {totalCategories} категорий.
          Добавляйте свои товары и магазины через админ-панель.
        </div>
      </div>
    </PageShell>
  );
}
