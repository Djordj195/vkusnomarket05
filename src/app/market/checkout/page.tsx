import { CheckoutView } from "./CheckoutView";
import { listProducts } from "@/server/products-store";
import { listVendors } from "@/server/vendors-store";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [products, vendors] = await Promise.all([
    listProducts({ buyerFacing: true }),
    listVendors({ status: "approved" }),
  ]);
  return <CheckoutView products={products} vendors={vendors} />;
}
