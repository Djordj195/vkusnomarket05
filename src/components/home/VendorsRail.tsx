import Link from "next/link";
import Image from "next/image";
import { Star, ArrowRight } from "lucide-react";
import {
  VERTICAL_EMOJIS,
  VERTICAL_LABELS,
  type Vendor,
} from "@/lib/types";

export function VendorsRail({
  vendors,
  cityName,
}: {
  vendors: Vendor[];
  cityName: string;
}) {
  if (vendors.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-4">
        <h2 className="text-[18px] font-bold text-ink-900">
          Продавцы · {cityName}
        </h2>
        <Link
          href="/market/vertical/food"
          className="inline-flex items-center gap-1 text-[14px] font-semibold text-brand-600 hover:text-brand-700"
        >
          Все
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-4 pb-1">
          {vendors.map((v) => (
            <Link
              key={v.id}
              href={`/vendor/${v.slug}`}
              className="relative flex w-[170px] shrink-0 flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition active:scale-[0.98]"
            >
              <div className="relative h-[88px] w-full bg-gradient-to-br from-brand-500 to-accent-500">
                {v.bannerUrl ? (
                  <Image
                    src={v.bannerUrl}
                    alt={v.brandName}
                    fill
                    sizes="170px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[36px] opacity-40">
                    {VERTICAL_EMOJIS[v.verticalPrimary]}
                  </div>
                )}
                {v.featured && (
                  <span className="absolute right-1.5 top-1.5 inline-flex items-center rounded-full bg-accent-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                    TOP
                  </span>
                )}
              </div>
              <div className="p-2.5 leading-tight">
                <div className="line-clamp-1 text-[13px] font-bold text-ink-900">
                  {v.brandName}
                </div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-ink-500">
                  {v.ratingCount > 0 ? (
                    <>
                      <Star
                        size={11}
                        className="fill-amber-400 text-amber-400"
                      />
                      <span className="font-semibold text-ink-700">
                        {v.ratingAvg.toFixed(1)}
                      </span>
                      <span>· {VERTICAL_LABELS[v.verticalPrimary]}</span>
                    </>
                  ) : (
                    <>
                      <span>{VERTICAL_EMOJIS[v.verticalPrimary]}</span>
                      <span>{VERTICAL_LABELS[v.verticalPrimary]}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
