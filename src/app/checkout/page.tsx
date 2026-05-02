import { CheckoutView } from "./CheckoutView";
import { listProducts } from "@/server/products-store";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const products = await listProducts();
  return <CheckoutView products={products} />;
}
