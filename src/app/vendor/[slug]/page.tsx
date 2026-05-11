import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Star,
  Phone,
  MessageCircle,
  Send,
  MapPin,
  Package,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  VERTICAL_EMOJIS,
  VERTICAL_LABELS,
  type Vertical,
} from "@/lib/types";
import { getVendorBySlug } from "@/server/vendors-store";
import { getProductsByVendor } from "@/server/products-store";
import { getCityById } from "@/server/cities-store";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return {};
  return {
    title: vendor.brandName,
    description:
      vendor.shortDescription ??
      `${VERTICAL_LABELS[vendor.verticalPrimary]} · ВКУСНОМАРКЕТ`,
  };
}

export default async function VendorStorefrontPage({ params }: PageProps) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();
  if (vendor.status !== "approved") notFound();

  const [products, city] = await Promise.all([
    getProductsByVendor(vendor.id),
    getCityById(vendor.cityId),
  ]);

  const verticals = uniqueVerticals(vendor.verticalPrimary, vendor.verticals);

  return (
    <PageShell>
      <Header variant="page" title={vendor.brandName} showBack />

      {/* Banner */}
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-brand-500 to-accent-500">
        {vendor.bannerUrl ? (
          <Image
            src={vendor.bannerUrl}
            alt={vendor.brandName}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[64px] opacity-30">
            {VERTICAL_EMOJIS[vendor.verticalPrimary]}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      </div>

      {/* Header card */}
      <div className="px-4 -mt-8 relative">
        <div className="rounded-2xl bg-white border border-ink-100 shadow-sm p-3">
          <div className="flex items-start gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-ink-100 ring-2 ring-white">
              {vendor.logoUrl ? (
                <Image
                  src={vendor.logoUrl}
                  alt={vendor.brandName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[28px]">
                  {VERTICAL_EMOJIS[vendor.verticalPrimary]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-[17px] font-bold text-ink-900">
                  {vendor.brandName}
                </h1>
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
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px]">
                {vendor.ratingCount > 0 ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-ink-700">
                    <Star
                      size={12}
                      className="fill-amber-400 text-amber-400"
                    />
                    {vendor.ratingAvg.toFixed(1)}
                    <span className="font-normal text-ink-400">
                      ({vendor.ratingCount})
                    </span>
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-400">Без отзывов</span>
                )}
                {city && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">
                    <MapPin size={11} /> {city.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Verticals */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {verticals.map((v) => (
              <Link
                key={v}
                href={`/vertical/${v}`}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700 hover:bg-brand-100"
              >
                <span>{VERTICAL_EMOJIS[v]}</span>
                {VERTICAL_LABELS[v]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 pb-6 space-y-5">
        {/* Description */}
        {vendor.description && (
          <section>
            <h2 className="mb-2 text-[15px] font-bold text-ink-900">
              О продавце
            </h2>
            <p className="text-[13px] leading-snug text-ink-600">
              {vendor.description}
            </p>
          </section>
        )}

        {/* Contacts */}
        {(vendor.contacts.phone ||
          vendor.contacts.whatsapp ||
          vendor.contacts.telegram) && (
          <section>
            <h2 className="mb-2 text-[15px] font-bold text-ink-900">
              Связаться
            </h2>
            <div className="flex flex-wrap gap-2">
              {vendor.contacts.phone && (
                <a
                  href={`tel:${vendor.contacts.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-brand-700"
                >
                  <Phone size={14} /> Позвонить
                </a>
              )}
              {vendor.contacts.whatsapp && (
                <a
                  href={`https://wa.me/${vendor.contacts.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-emerald-600"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {vendor.contacts.telegram && (
                <a
                  href={`https://t.me/${vendor.contacts.telegram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-sky-600"
                >
                  <Send size={14} /> Telegram
                </a>
              )}
            </div>
          </section>
        )}

        {/* Products */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold text-ink-900">Ассортимент</h2>
            <span className="text-[12px] text-ink-500">
              {products.length}{" "}
              {pluralize(products.length, ["товар", "товара", "товаров"])}
            </span>
          </div>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <EmptyState
              icon={Package}
              title="Пока без товаров"
              description="Продавец ещё не загрузил свой ассортимент. Загляните позже."
            />
          )}
        </section>
      </div>
    </PageShell>
  );
}

function uniqueVerticals(
  primary: Vertical,
  extra: Vertical[] | undefined
): Vertical[] {
  const set = new Set<Vertical>([primary]);
  (extra ?? []).forEach((v) => set.add(v));
  return Array.from(set);
}

function pluralize(n: number, forms: [string, string, string]): string {
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return forms[2];
  if (m10 === 1) return forms[0];
  if (m10 >= 2 && m10 <= 4) return forms[1];
  return forms[2];
}
