"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFavorites } from "@/store/favorites";
import type { Product } from "@/lib/types";

type Props = { allProducts: Product[] };

export function FavoritesView({ allProducts }: Props) {
  const ids = useFavorites((s) => s.ids);
  const products = useMemo(
    () => allProducts.filter((p) => ids.includes(p.id)),
    [allProducts, ids]
  );

  return (
    <PageShell>
      <Header variant="page" title="Избранное" showBack />
      <div className="px-4 pt-2 pb-4">
        {products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="В избранном пока пусто"
            description="Нажмите на сердечко на товаре, чтобы добавить его сюда."
            action={
              <Link href="/">
                <Button>Перейти в каталог</Button>
              </Link>
            }
          />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </PageShell>
  );
}
