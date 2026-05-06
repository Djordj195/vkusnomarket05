import { notFound } from "next/navigation";
import { Star, Store } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/Badge";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getShopBySlug } from "@/server/shops-store";
import { getProductsByShop } from "@/server/products-store";
import { SOURCE_SHORT_LABELS } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  return {
    title: shop?.name ?? "Магазин",
    description: shop?.description,
  };
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const products = await getProductsByShop(shop.id);

  return (
    <PageShell>
      <Header variant="page" title={shop.name} showBack />
      <div className="space-y-5 pb-4">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink-100">
          {shop.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.cover}
              alt={shop.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-300">
              <Store size={56} />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{SOURCE_SHORT_LABELS[shop.source]}</Badge>
            {shop.isOpen === false ? (
              <Badge tone="danger">Закрыто</Badge>
            ) : (
              <Badge tone="success">Открыто</Badge>
            )}
          </div>
        </div>

        <div className="space-y-4 px-4">
          <div>
            <h1 className="text-[22px] font-bold leading-tight text-ink-900">
              {shop.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-500">
              {typeof shop.rating === "number" && (
                <span className="inline-flex items-center gap-1 text-ink-700">
                  <Star
                    size={14}
                    className="fill-amber-400 text-amber-400"
                  />
                  <span className="font-semibold">
                    {shop.rating.toFixed(1)}
                  </span>
                </span>
              )}
              <span>
                {products.length}{" "}
                {pluralize(products.length, ["товар", "товара", "товаров"])}
              </span>
            </div>
          </div>

          {shop.description && (
            <p className="text-[14px] leading-relaxed text-ink-700">
              {shop.description}
            </p>
          )}

          <section className="pt-2">
            <h2 className="mb-3 text-[16px] font-bold text-ink-900">Товары</h2>
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <EmptyState
                icon={Store}
                title="В этой лавке пока нет товаров"
                description="Товары добавляются через админ-панель."
              />
            )}
          </section>
        </div>
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
