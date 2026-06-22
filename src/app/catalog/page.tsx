import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Package } from "lucide-react";
import { listProducts } from "@/server/products-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Все товары",
};

export default async function CatalogPage() {
  const products = await listProducts({ buyerFacing: true });

  return (
    <PageShell>
      <Header variant="page" title="Все товары" showBack />
      <div className="px-4 pt-2 pb-4 space-y-4">
        <div className="rounded-2xl bg-brand-50 p-4">
          <h2 className="text-[15px] font-bold text-ink-900">
            Все товары магазина
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-500">
            {products.length}{" "}
            {pluralize(products.length, ["товар", "товара", "товаров"])}
          </p>
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            icon={Package}
            title="Каталог пока пуст"
            description="Скоро здесь появятся товары."
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
