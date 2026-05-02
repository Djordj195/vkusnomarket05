import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import { ProductsList } from "./ProductsList";

export default function AdminProductsPage() {
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

      <ProductsList products={PRODUCTS} categories={CATEGORIES} />
    </div>
  );
}
