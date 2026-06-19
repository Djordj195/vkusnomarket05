import { getCurrentVendor } from "@/server/vendor-auth";
import { getProductsByVendor } from "@/server/products-store";
import { listCategories } from "@/server/categories-store";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { VendorCatalogManager } from "./VendorCatalogManager";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-500">
          Управляйте товарами или подключите автоматическую синхронизацию.
        </p>
        <Link
          href="/vendor/dashboard/catalog/sync"
          className="flex items-center gap-1.5 rounded-xl bg-brand-50 border border-brand-200 px-3 py-1.5 text-[12px] font-medium text-brand-700 hover:bg-brand-100 transition-colors shrink-0"
        >
          <RefreshCw size={14} />
          Синхронизация
        </Link>
      </div>
      <VendorCatalogManager products={products} categories={categories} />
    </div>
  );
}
