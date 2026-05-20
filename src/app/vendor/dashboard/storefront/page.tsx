import Image from "next/image";
import { getCurrentVendor } from "@/server/vendor-auth";
import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

export default async function VendorStorefrontPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  return (
    <div className="space-y-4">
      <SubpageHeader title="Витрина" />
      <p className="text-[13px] text-ink-500">
        Здесь вы управляете тем, как клиенты видят ваш магазин в каталоге
        ВкусМаркета.
      </p>

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[14px] font-bold text-ink-900">Шапка магазина</h2>
        <div className="mt-3 grid grid-cols-[64px,1fr] gap-3">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-ink-100">
            {vendor.logoUrl ? (
              <Image
                src={vendor.logoUrl}
                alt={vendor.brandName}
                width={64}
                height={64}
                className="h-16 w-16 object-cover"
              />
            ) : (
              <span className="text-[11px] text-ink-400">Лого</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-ink-900">
              {vendor.brandName}
            </div>
            <div className="mt-0.5 truncate text-[12px] text-ink-500">
              {vendor.shortDescription || "Короткое описание не задано"}
            </div>
          </div>
        </div>
      </section>

      <PlaceholderCard
        title="Редактор витрины — в разработке"
        description="Загрузка логотипа, баннера, описание, цветовые акценты, контакты, график работы, условия доставки и минимальный заказ появятся в ближайшем апдейте (Phase 3.3 — MediaUploader)."
        ctaHref="/vendor/dashboard"
        ctaLabel="К обзору"
      />
    </div>
  );
}
