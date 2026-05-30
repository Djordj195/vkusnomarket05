import { listVendors } from "@/server/vendors-store";
import { listCategories } from "@/server/categories-store";
import { PromoForm } from "../PromoForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Новый промокод · Админка",
};

export default async function NewPromoPage() {
  const [vendors, categories] = await Promise.all([
    listVendors(),
    listCategories(),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-extrabold leading-tight text-ink-900">
        Новый промокод
      </h1>
      <PromoForm
        promo={null}
        vendors={vendors.map((v) => ({ id: v.id, brandName: v.brandName }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
