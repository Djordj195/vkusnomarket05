import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkles } from "lucide-react";
import { getWeeklyProducts } from "@/server/products-store";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Товары недели",
};

export default async function WeeklyPage() {
  const products = await getWeeklyProducts();

  return (
    <PageShell>
      <Header variant="page" title="Товары недели" showBack />
      <div className="px-4 pt-2 pb-4 space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 p-4 text-white shadow-md shadow-brand-600/25">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold">Лучшие цены и свежесть</h2>
            <p className="text-[12px] text-brand-100">
              {products.length} {pluralize(products.length)} со скидкой и от
              поставщиков
            </p>
          </div>
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Раздел пока пуст"
            description="Скоро здесь появятся специальные предложения."
          />
        )}
      </div>
    </PageShell>
  );
}

function pluralize(n: number): string {
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return "товаров";
  if (m10 === 1) return "товар";
  if (m10 >= 2 && m10 <= 4) return "товара";
  return "товаров";
}
