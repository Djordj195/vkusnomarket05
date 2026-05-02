import { HomeView } from "./HomeView";
import { listCategories } from "@/server/categories-store";
import { listShops } from "@/server/shops-store";
import { listProducts } from "@/server/products-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, shops, products] = await Promise.all([
    listCategories(),
    listShops(),
    listProducts(),
  ]);
  return (
    <HomeView categories={categories} shops={shops} products={products} />
  );
}
