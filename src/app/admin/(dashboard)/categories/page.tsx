import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { Badge } from "@/components/ui/Badge";
import { SOURCE_SHORT_LABELS } from "@/lib/types";

export default function AdminCategoriesPage() {
  const counts = new Map<string, number>();
  for (const p of PRODUCTS) {
    counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[24px] font-extrabold text-ink-900">Категории</h1>
        <p className="text-[14px] text-ink-500">
          Структура каталога. После подключения БД — редактирование с этой
          страницы.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIES.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-[28px]">{c.emoji}</span>
              <div className="leading-tight">
                <div className="font-semibold text-ink-900">{c.name}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Badge tone="brand">{SOURCE_SHORT_LABELS[c.source]}</Badge>
                  <span className="text-[11px] text-ink-500">
                    {counts.get(c.id) ?? 0} товаров
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
