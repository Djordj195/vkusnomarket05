import { CartView } from "./CartView";
import { listProducts } from "@/server/products-store";
import { listVendors } from "@/server/vendors-store";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [products, vendors] = await Promise.all([
    listProducts(),
    listVendors(),
  ]);
  return <CartView products={products} vendors={vendors} />;
}
