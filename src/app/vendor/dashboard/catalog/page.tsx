import { getCurrentVendor } from "@/server/vendor-auth";
import { getProductsByVendor } from "@/server/products-store";
import { listCategories } from "@/server/categories-store";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { VendorCatalogManager } from "./VendorCatalogManager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorCatalogPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vendor/login");

  const [products, categories] = await Promise.all([
    getProductsByVendor(vendor.id),
    listCategories(),
  ]);

  return (
    <div className="space-y-4">
      <SubpageHeader title="Каталог" />
      <p className="text-[13px] text-ink-500">
        Управление товарами вашего магазина: добавляйте товары, устанавливайте
        цены, загружайте фотографии.
      </p>
      <VendorCatalogManager products={products} categories={categories} />
    </div>
  );
}
