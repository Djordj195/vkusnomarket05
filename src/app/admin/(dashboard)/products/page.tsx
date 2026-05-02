import Image from "next/image";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { SOURCE_SHORT_LABELS } from "@/lib/types";

export default function AdminProductsPage() {
  const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Товары</h1>
        <p className="text-[13px] text-ink-500">
          Сейчас отображаются демо-товары из файла{" "}
          <code className="rounded bg-ink-100 px-1 font-mono text-[11px]">
            src/data/products.ts
          </code>
          .
        </p>
      </header>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-snug text-amber-800">
        <strong>Скоро здесь появится редактирование:</strong> добавление,
        изменение цены, наличия, фото и описания. После подключения базы
        данных Supabase эта страница станет полностью рабочей.
      </div>

      <ul className="space-y-2">
        {PRODUCTS.map((p) => {
          const cat = categoryMap.get(p.categoryId);
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-ink-900">
                  {p.name}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                  <Badge tone="brand">{SOURCE_SHORT_LABELS[p.source]}</Badge>
                  <span className="truncate">{cat?.name ?? "—"}</span>
                  <span>· {p.weight}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="whitespace-nowrap text-[13px] font-extrabold text-ink-900">
                  {formatPrice(p.price)}
                </div>
                <div className="text-[10px] text-ink-500">/ {p.unit}</div>
                {p.inStock ? (
                  <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    В наличии
                  </span>
                ) : (
                  <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                    Нет
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
