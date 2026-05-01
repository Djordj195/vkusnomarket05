import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Package } from "lucide-react";
import { CATEGORIES, getCategoryBySlug } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  return {
    title: category?.name ?? "Категория",
  };
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const products = getProductsByCategory(category.id);

  return (
    <PageShell>
      <Header variant="page" title={category.name} showBack />
      <div className="px-4 pt-2 pb-4 space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4">
          <span className="text-[36px] leading-none">{category.emoji}</span>
          <div>
            <h2 className="text-[15px] font-bold text-ink-900">
              {category.name}
            </h2>
            <p className="text-[12px] text-ink-500">
              {products.length} {pluralize(products.length, ["товар", "товара", "товаров"])}
            </p>
          </div>
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            icon={Package}
            title="В этой категории пока пусто"
            description="Добавьте товары через админ-панель."
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
