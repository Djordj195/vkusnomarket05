import { CartView } from "./CartView";
import { listProducts } from "@/server/products-store";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const products = await listProducts();
  return <CartView products={products} />;
}
