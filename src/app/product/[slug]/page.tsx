import { notFound } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/Badge";
import { StarRatingStatic } from "@/components/ui/StarRating";
import {
  getProductBySlug,
  getProductsByCategory,
} from "@/server/products-store";
import { getCategoryById } from "@/server/categories-store";
import { listApprovedReviews, getRatingStats } from "@/server/reviews-store";
import { formatPrice } from "@/lib/utils";
import { ProductActions } from "./ProductActions";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ReviewsList } from "@/components/catalog/ReviewsList";
import { ReviewForm } from "@/components/catalog/ReviewForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product?.name ?? "Товар",
    description: product?.description,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, relatedAll, reviews, stats] = await Promise.all([
    getCategoryById(product.categoryId),
    getProductsByCategory(product.categoryId),
    listApprovedReviews("product", product.id),
    getRatingStats("product", product.id),
  ]);

  const related = relatedAll
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <PageShell>
      <Header variant="page" title={product.name} showBack />
      <div className="space-y-5 pb-4">
        <div className="relative aspect-square w-full bg-ink-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            priority
            className="object-cover"
          />
          {product.isWeekly && (
            <div className="absolute left-3 top-3">
              <Badge tone="accent">Товар недели</Badge>
            </div>
          )}
        </div>

        <div className="px-4 space-y-4">
          {category && (
            <div className="text-[12px] font-medium text-brand-700">
              {category.name}
            </div>
          )}
          <h1 className="text-[22px] font-bold leading-tight text-ink-900">
            {product.name}
          </h1>

          {stats.count > 0 && (
            <StarRatingStatic rating={stats.avg} count={stats.count} />
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-ink-900">
              {formatPrice(product.price)}
            </span>
            <span className="text-[14px] text-ink-500">/ {product.unit}</span>
            {product.weight && (
              <span className="ml-auto text-[12px] text-ink-500">
                {product.weight}
              </span>
            )}
          </div>

          {!product.inStock && (
            <Badge tone="warn">Нет в наличии</Badge>
          )}

          <p className="text-[14px] leading-relaxed text-ink-700">
            {product.description}
          </p>

          {/* Reviews section */}
          <section className="pt-3">
            <h2 className="mb-3 text-[16px] font-bold text-ink-900">
              Отзывы
              {stats.count > 0 && (
                <span className="ml-1.5 text-[13px] font-normal text-ink-500">
                  ({stats.count})
                </span>
              )}
            </h2>
            <ReviewsList reviews={reviews} />
            <div className="mt-4">
              <ReviewForm
                targetType="product"
                targetId={product.id}
                targetName={product.name}
              />
            </div>
          </section>

          {related.length > 0 && (
            <section className="pt-2">
              <h2 className="mb-3 text-[16px] font-bold text-ink-900">
                Похожие товары
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-5">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <ProductActions product={product} />
    </PageShell>
  );
}
