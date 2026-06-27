import { FavoritesView } from "./FavoritesView";
import { listProducts } from "@/server/products-store";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const products = await listProducts({ buyerFacing: true });
  return <FavoritesView allProducts={products} />;
}
