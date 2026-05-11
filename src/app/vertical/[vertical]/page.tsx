import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Star, MapPin, Sparkles } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  VERTICAL_EMOJIS,
  VERTICAL_LABELS,
  type Vendor,
  type Vertical,
} from "@/lib/types";
import { listVendors } from "@/server/vendors-store";
import { getCurrentCity } from "@/server/current-city";

const VALID_VERTICALS = new Set<Vertical>([
  "food",
  "grocery",
  "pharmacy",
  "chemistry",
]);

const VERTICAL_DESCRIPTIONS: Record<Vertical, string> = {
  food: "Кафе, рестораны и доставка готовых блюд.",
  grocery: "Продукты с местного рынка, лавок и магазинов.",
  pharmacy:
    "Только безрецептурные препараты и БАДы от лицензированных аптек-партнёров.",
  chemistry: "Бытовая химия, уборка, гигиена и товары для дома.",
};

type PageProps = {
  params: Promise<{ vertical: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { vertical } = await params;
  if (!VALID_VERTICALS.has(vertical as Vertical)) return {};
  return {
    title: VERTICAL_LABELS[vertical as Vertical],
  };
}

export default async function VerticalPage({ params }: PageProps) {
  const { vertical } = await params;
  if (!VALID_VERTICALS.has(vertical as Vertical)) notFound();
  const v = vertical as Vertical;

  const [city, allCityVendors] = await Promise.all([
    getCurrentCity(),
    // Берём всех approved-продавцов в текущем городе, затем фильтруем
    // по вертикали (включая дополнительные verticals[]).
    listVendors({ cityId: undefined, status: "approved" }),
  ]);

  const cityVendors = allCityVendors.filter((vd) => vd.cityId === city.id);
  const vendors = cityVendors
    .filter(
      (vd) => vd.verticalPrimary === v || (vd.verticals ?? []).includes(v)
    )
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.ratingAvg !== b.ratingAvg) return b.ratingAvg - a.ratingAvg;
      return a.sortOrder - b.sortOrder;
    });

  const isCityActive = city.status === "active";

  return (
    <PageShell>
      <Header
        variant="page"
        title={VERTICAL_LABELS[v]}
        showBack
        rightSlot={
          <Link
            href="/catalog"
            className="text-[13px] font-semibold text-brand-600"
          >
            Каталог
          </Link>
        }
      />
      <div className="px-4 pt-2 pb-6 space-y-5">
        <div className="rounded-2xl bg-brand-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[20px] shadow-sm">
              {VERTICAL_EMOJIS[v]}
            </div>
            <div className="min-w-0">
              <h2 className="text-[16px] font-bold text-ink-900">
                {VERTICAL_LABELS[v]}
              </h2>
              <p className="mt-0.5 text-[12px] leading-snug text-ink-500">
                {VERTICAL_DESCRIPTIONS[v]}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
                <MapPin size={12} />
                {city.name} · {vendors.length}{" "}
                {pluralize(vendors.length, [
                  "продавец",
                  "продавца",
                  "продавцов",
                ])}
              </p>
            </div>
          </div>
        </div>

        {!isCityActive ? (
          <ComingSoonNotice cityName={city.name} vertical={v} />
        ) : vendors.length > 0 ? (
          <ul className="space-y-2.5">
            {vendors.map((vd) => (
              <li key={vd.id}>
                <VendorCard vendor={vd} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Sparkles}
            title={`Пока нет продавцов · ${VERTICAL_LABELS[v]}`}
            description={`В ${city.name} мы ещё подключаем партнёров в эту вертикаль. Если у вас есть подходящий бизнес — напишите нам.`}
          />
        )}
      </div>
    </PageShell>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link
      href={`/vendor/${vendor.slug}`}
      className="flex gap-3 rounded-2xl border border-ink-100 bg-white p-3 transition hover:border-brand-200 hover:shadow-sm active:scale-[0.99]"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-ink-100">
        {vendor.logoUrl ? (
          <Image
            src={vendor.logoUrl}
            alt={vendor.brandName}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[24px]">
            {VERTICAL_EMOJIS[vendor.verticalPrimary]}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[15px] font-bold text-ink-900">
            {vendor.brandName}
          </h3>
          {vendor.featured && (
            <span className="inline-flex items-center rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-bold text-accent-700">
              TOP
            </span>
          )}
        </div>
        {vendor.shortDescription && (
          <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-500">
            {vendor.shortDescription}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2 text-[12px]">
          {vendor.ratingCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-ink-700">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {vendor.ratingAvg.toFixed(1)}
              <span className="font-normal text-ink-400">
                ({vendor.ratingCount})
              </span>
            </span>
          ) : (
            <span className="text-[11px] text-ink-400">Без отзывов</span>
          )}
          <span className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">
            {VERTICAL_EMOJIS[vendor.verticalPrimary]}{" "}
            {labelFor(vendor.verticalPrimary)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ComingSoonNotice({
  cityName,
  vertical,
}: {
  cityName: string;
  vertical: Vertical;
}) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
      <h3 className="text-[15px] font-bold text-brand-900">
        {VERTICAL_LABELS[vertical]} в {cityName} — скоро
      </h3>
      <p className="mt-1 text-[12px] leading-snug text-brand-800/90">
        Мы пока не подключили продавцов в этой вертикали. Если вы предприниматель
        — напишите нам, и мы запустим ВКУСНОМАРКЕТ здесь раньше.
      </p>
    </div>
  );
}

function labelFor(v: Vertical): string {
  return VERTICAL_LABELS[v];
}

function pluralize(n: number, forms: [string, string, string]): string {
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return forms[2];
  if (m10 === 1) return forms[0];
  if (m10 >= 2 && m10 <= 4) return forms[1];
  return forms[2];
}
