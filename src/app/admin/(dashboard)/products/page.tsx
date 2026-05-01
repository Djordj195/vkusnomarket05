import Image from "next/image";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { SOURCE_SHORT_LABELS } from "@/lib/types";

export default function AdminProductsPage() {
  const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-ink-900">Товары</h1>
          <p className="text-[14px] text-ink-500">
            Сейчас отображаются демо-товары из файла{" "}
            <code className="rounded bg-ink-100 px-1 font-mono text-[12px]">
              src/data/products.ts
            </code>
            .
          </p>
        </div>
      </header>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800">
        <strong>Скоро здесь появится редактирование:</strong> добавление,
        изменение цены, наличия, фото и описания. После подключения базы
        данных Supabase эта страница станет полностью рабочей.
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 text-left text-ink-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Товар</th>
              <th className="px-4 py-3 font-semibold">Раздел</th>
              <th className="px-4 py-3 font-semibold">Категория</th>
              <th className="px-4 py-3 font-semibold">Цена</th>
              <th className="px-4 py-3 font-semibold">Наличие</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const cat = categoryMap.get(p.categoryId);
              return (
                <tr key={p.id} className="border-t border-ink-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="leading-tight">
                        <div className="font-semibold text-ink-900">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-ink-500">
                          {p.weight}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="brand">
                      {SOURCE_SHORT_LABELS[p.source]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {cat?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">
                    {formatPrice(p.price)} / {p.unit}
                  </td>
                  <td className="px-4 py-3">
                    {p.inStock ? (
                      <Badge tone="success">В наличии</Badge>
                    ) : (
                      <Badge tone="danger">Нет</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
