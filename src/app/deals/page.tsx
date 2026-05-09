import Link from "next/link";
import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { listProducts } from "@/server/products-store";
import { Sparkles, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Скидки" };

export default async function DealsPage() {
  const all = await listProducts();
  const weekly = all.filter((p) => p.isWeekly);
  const discounted = all.filter(
    (p) => p.oldPrice && p.oldPrice > p.price && !p.isWeekly
  );

  return (
    <PageShell className="bg-white">
      <div className="px-4 pt-3">
        <div className="flex items-center justify-center">
          <BrandPill />
        </div>
      </div>

      <div className="px-4 pt-6">
        <h1 className="text-[28px] font-extrabold text-ink-900">Скидки</h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Лучшие цены на товары недели и сезонные предложения.
        </p>
      </div>

      <div className="px-4 mt-5">
        <Link
          href="/weekly"
          className="relative flex h-[120px] items-center overflow-hidden rounded-3xl bg-brand-500 px-5 text-white card-shadow"
        >
          <div className="flex-1 leading-tight">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-brand-100">
              <Sparkles size={14} />
              Товары недели
            </div>
            <div className="mt-1 text-[20px] font-extrabold">
              Лучшие цены и свежесть
            </div>
            <div className="mt-1 text-[12px] text-brand-100">
              {weekly.length} {pluralize(weekly.length)}
            </div>
          </div>
          <div className="pointer-events-none absolute -right-3 top-1/2 -translate-y-1/2 flex h-24 w-24 items-center justify-center rounded-full bg-accent-300 text-ink-900 shadow-lg">
            <Tag size={36} strokeWidth={2.2} />
          </div>
        </Link>
      </div>

      {weekly.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 px-4 text-[18px] font-bold text-ink-900">
            Товары недели
          </h2>
          <div className="px-4">
            <ProductGrid products={weekly} />
          </div>
        </section>
      )}

      {discounted.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 px-4 text-[18px] font-bold text-ink-900">
            Со скидкой
          </h2>
          <ul className="px-4 space-y-2">
            {discounted.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/product/${p.slug}`}
                  className="flex items-center gap-3 rounded-2xl bg-ink-100 p-3"
                >
                  <Image
                    src={p.image}
                    alt={p.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div className="flex-1 leading-tight">
                    <div className="text-[14px] font-semibold text-ink-900">
                      {p.name}
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-[15px] font-bold text-ink-900">
                        {formatPrice(p.price)}
                      </span>
                      {p.oldPrice && (
                        <span className="text-[12px] text-ink-400 line-through">
                          {formatPrice(p.oldPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {weekly.length === 0 && discounted.length === 0 && (
        <div className="px-4 mt-10 text-center text-[14px] text-ink-500">
          Скидок пока нет — загляните позже.
        </div>
      )}

      <div className="h-6" />
    </PageShell>
  );
}

function pluralize(n: number): string {
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return "товаров";
  if (m10 === 1) return "товар";
  if (m10 >= 2 && m10 <= 4) return "товара";
  return "товаров";
}
