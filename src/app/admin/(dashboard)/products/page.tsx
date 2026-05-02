import { listProducts } from "@/server/products-store";
import { listCategories } from "@/server/categories-store";
import { isSupabaseConfigured } from "@/server/supabase";
import { ProductsList } from "./ProductsList";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    listProducts(),
    listCategories(),
  ]);
  const dbConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Товары</h1>
        <p className="text-[13px] text-ink-500">
          Добавляйте, редактируйте и удаляйте товары — изменения сразу видны
          клиентам.
        </p>
      </header>

      <ProductsList
        products={products}
        categories={categories}
        dbConfigured={dbConfigured}
      />
    </div>
  );
}
