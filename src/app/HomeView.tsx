"use client";

import { useMemo } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { HomeHero } from "@/components/home/HomeHero";
import { StoriesRail } from "@/components/home/StoriesRail";
import { HighlightCards } from "@/components/home/HighlightCards";
import { IdeasSection } from "@/components/home/IdeasSection";
import { CategoryGrid } from "@/components/catalog/CategoryGrid";
import { ProductGrid } from "@/components/catalog/ProductCard";
import type { Category, Product, Shop } from "@/lib/types";

type Props = {
  categories: Category[];
  shops: Shop[];
  products: Product[];
};

export function HomeView({ categories, products }: Props) {
  const weekly = useMemo(
    () => products.filter((p) => p.isWeekly),
    [products]
  );
  const homeCategories = categories;
  const popularProducts = useMemo(
    () => products.slice(0, 6),
    [products]
  );

  return (
    <PageShell className="bg-white" noBottomPadding>
      <div className="pb-bottom-nav space-y-6">
        <HomeHero />

        <StoriesRail weekly={weekly} />

        <HighlightCards />

        {homeCategories.length > 0 && (
          <section>
            <h2 className="mb-3 px-4 text-[18px] font-bold text-ink-900">
              Все категории
            </h2>
            <div className="px-4">
              <CategoryGrid items={homeCategories} />
            </div>
          </section>
        )}

        {popularProducts.length > 0 && (
          <section>
            <h2 className="mb-3 px-4 text-[18px] font-bold text-ink-900">
              Популярные товары
            </h2>
            <div className="px-4">
              <ProductGrid products={popularProducts} />
            </div>
          </section>
        )}

        <IdeasSection />
      </div>
    </PageShell>
  );
}
