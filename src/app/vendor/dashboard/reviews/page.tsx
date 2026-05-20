import { Star } from "lucide-react";
import { getCurrentVendor } from "@/server/vendor-auth";
import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

export default async function VendorReviewsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  return (
    <div className="space-y-4">
      <SubpageHeader title="Отзывы" />

      <section className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          <Star size={22} fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[22px] font-extrabold leading-none text-ink-900">
            {vendor.ratingAvg ? vendor.ratingAvg.toFixed(1) : "—"}
          </div>
          <div className="mt-0.5 text-[12px] text-ink-500">
            {vendor.ratingCount
              ? `${vendor.ratingCount} отзывов`
              : "Отзывов пока нет"}
          </div>
        </div>
      </section>

      <PlaceholderCard
        title="Список отзывов появится после первых заказов"
        description="Здесь будут показываться отзывы клиентов, оценки и комментарии. Вы сможете отвечать на отзывы — ответ будет виден всем."
      />
    </div>
  );
}
