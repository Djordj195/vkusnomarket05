import { listShops } from "@/server/shops-store";
import { listProducts } from "@/server/products-store";
import { isSupabaseConfigured } from "@/server/supabase";
import { ShopsList } from "./ShopsList";

export const dynamic = "force-dynamic";

export default async function AdminShopsPage() {
  const [shops, products] = await Promise.all([listShops(), listProducts()]);
  const productCounts: Record<string, number> = {};
  for (const p of products) {
    if (p.shopId) {
      productCounts[p.shopId] = (productCounts[p.shopId] ?? 0) + 1;
    }
  }
  const dbConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Магазины и лавки
        </h1>
        <p className="text-[13px] text-ink-500">
          Добавляйте сюда продавцов, кафе и рестораны — они появятся в разделе
          «Лавки» у клиентов.
        </p>
      </header>

      <ShopsList
        shops={shops}
        productCounts={productCounts}
        dbConfigured={dbConfigured}
      />
    </div>
  );
}
