"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { HomeHero } from "@/components/home/HomeHero";
import { RecommendRail } from "@/components/home/RecommendRail";
import { RepeatLastOrderCard } from "@/components/home/RepeatLastOrderCard";
import { FeedbackHomeCard } from "@/components/home/FeedbackHomeCard";
import { VendorsRail } from "@/components/home/VendorsRail";
import { CategoryGrid } from "@/components/catalog/CategoryGrid";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { CityPicker } from "@/components/layout/CityPicker";
import { CityComingSoonNotice } from "@/components/home/CityComingSoonNotice";
import { sortCategoriesByGroup } from "@/lib/category-order";
import type { Category, City, Product, Shop, Vendor } from "@/lib/types";

import type { ApprovedFeedback } from "@/server/feedback-store";

type Props = {
  categories: Category[];
  shops: Shop[];
  products: Product[];
  vendors: Vendor[];
  approvedFeedback: ApprovedFeedback[];
  approvedFeedbackTotal: number;
  currentCity: City;
  cities: City[];
};

export function HomeView({
  categories,
  products,
  vendors,
  approvedFeedback,
  approvedFeedbackTotal,
  currentCity,
  cities,
}: Props) {
  const weekly = useMemo(
    () => products.filter((p) => p.isWeekly),
    [products]
  );
  const homeCategories = useMemo(
    () => sortCategoriesByGroup(categories),
    [categories]
  );
  const popularProducts = useMemo(
    () => products.slice(0, 6),
    [products]
  );

  const isComingSoon = currentCity.status !== "active";

  return (
    <PageShell className="bg-white" noBottomPadding>
      <div className="pb-bottom-nav space-y-6">
        <HomeHero
          citySlot={<CityPicker currentCity={currentCity} cities={cities} tone="hero" />}
        />

        {isComingSoon && <CityComingSoonNotice city={currentCity} />}

        <RepeatLastOrderCard />

        {!isComingSoon && vendors.length > 0 && (
          <VendorsRail vendors={vendors} cityName={currentCity.name} />
        )}

        <RecommendRail
          weekly={weekly}
          popular={popularProducts.filter((p) => !p.isWeekly).slice(0, 4)}
        />

        {homeCategories.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between px-4">
              <h2 className="text-[18px] font-bold text-ink-900">
                Все категории
              </h2>
              <Link
                href="/market/catalog"
                className="inline-flex items-center gap-1 text-[14px] font-semibold text-brand-600 hover:text-brand-700"
              >
                Всё
                <ArrowRight size={16} />
              </Link>
            </div>
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

        <FeedbackHomeCard
          items={approvedFeedback}
          total={approvedFeedbackTotal}
        />
      </div>
    </PageShell>
  );
}
