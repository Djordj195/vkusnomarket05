import { listProducts } from "@/server/products-store";
import { listCategories } from "@/server/categories-store";
import { isSupabaseConfigured } from "@/server/supabase";
import { WeeklyManager } from "./WeeklyManager";

export const dynamic = "force-dynamic";

export default async function AdminWeeklyPage() {
  const [products, categories] = await Promise.all([
    listProducts(),
    listCategories(),
  ]);
  const dbConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Товары недели
        </h1>
        <p className="text-[13px] text-ink-500">
          Эти товары показываются клиентам в блоке «Товары недели» на главной.
        </p>
      </header>

      <WeeklyManager
        products={products}
        categories={categories}
        dbConfigured={dbConfigured}
      />
    </div>
  );
}
