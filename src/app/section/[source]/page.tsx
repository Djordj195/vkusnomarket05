import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { CategoryGrid } from "@/components/catalog/CategoryGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Package } from "lucide-react";
import { listProducts } from "@/server/products-store";
import { listCategories } from "@/server/categories-store";
import { SOURCE_LABELS, SOURCE_SHORT_LABELS, type SourceType } from "@/lib/types";
import { sortCategoriesByGroup } from "@/lib/category-order";

const VALID_SOURCES = new Set<SourceType>(["market", "food", "shop"]);

type PageProps = {
  params: Promise<{ source: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { source } = await params;
  if (!VALID_SOURCES.has(source as SourceType)) return {};
  return {
    title: SOURCE_LABELS[source as SourceType],
  };
}

export default async function SectionPage({ params }: PageProps) {
  const { source } = await params;
  if (!VALID_SOURCES.has(source as SourceType)) notFound();
  const src = source as SourceType;

  const [allProducts, allCategories] = await Promise.all([
    listProducts(),
    listCategories(),
  ]);
  const products = allProducts.filter((p) => p.source === src);
  const categories = sortCategoriesByGroup(
    allCategories.filter((c) => c.source === src)
  );

  return (
    <PageShell>
      <Header
        variant="page"
        title={SOURCE_SHORT_LABELS[src]}
        showBack
        rightSlot={
          <Link
            href="/catalog"
            className="text-[13px] font-semibold text-brand-600"
          >
            Все товары
          </Link>
        }
      />
      <div className="px-4 pt-2 pb-4 space-y-5">
        <div className="rounded-2xl bg-brand-50 p-4">
          <h2 className="text-[15px] font-bold text-ink-900">
            {SOURCE_LABELS[src]}
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-500">
            {products.length}{" "}
            {pluralize(products.length, ["товар", "товара", "товаров"])} ·{" "}
            {categories.length}{" "}
            {pluralize(categories.length, ["категория", "категории", "категорий"])}
          </p>
        </div>

        {categories.length > 0 && (
          <section>
            <h3 className="mb-3 text-[16px] font-bold text-ink-900">
              Категории
            </h3>
            <CategoryGrid items={categories} />
          </section>
        )}

        {products.length > 0 ? (
          <section>
            <h3 className="mb-3 text-[16px] font-bold text-ink-900">Товары</h3>
            <ProductGrid products={products} />
          </section>
        ) : (
          <EmptyState
            icon={Package}
            title="В этом разделе пока пусто"
            description="Загляните позже — добавляем товары каждый день."
          />
        )}
      </div>
    </PageShell>
  );
}

function pluralize(n: number, forms: [string, string, string]): string {
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return forms[2];
  if (m10 === 1) return forms[0];
  if (m10 >= 2 && m10 <= 4) return forms[1];
  return forms[2];
}
