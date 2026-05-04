import { listCategories } from "@/server/categories-store";
import { listProducts } from "@/server/products-store";
import { isSupabaseConfigured } from "@/server/supabase";
import { CategoriesList } from "./CategoriesList";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts(),
  ]);
  const productCounts: Record<string, number> = {};
  for (const p of products) {
    productCounts[p.categoryId] = (productCounts[p.categoryId] ?? 0) + 1;
  }
  const dbConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Категории</h1>
        <p className="text-[13px] text-ink-500">
          Структура каталога. Добавляйте, редактируйте и удаляйте категории —
          изменения сразу видны клиентам.
        </p>
      </header>

      <CategoriesList
        categories={categories}
        productCounts={productCounts}
        dbConfigured={dbConfigured}
      />
    </div>
  );
}
