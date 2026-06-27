import { SearchView } from "./SearchView";
import { listProducts } from "@/server/products-store";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const products = await listProducts({ buyerFacing: true });
  return <SearchView allProducts={products} />;
}
