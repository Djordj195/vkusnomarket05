import { FavoritesView } from "./FavoritesView";
import { listProducts } from "@/server/products-store";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const products = await listProducts();
  return <FavoritesView allProducts={products} />;
}
