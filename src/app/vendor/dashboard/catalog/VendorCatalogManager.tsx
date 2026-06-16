"use client";

import Image from "next/image";
import {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Pencil, Plus, Search, Trash2, X, Package } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { SOURCE_SHORT_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VendorImagePicker } from "@/components/vendor/VendorImagePicker";
import { formatPrice } from "@/lib/utils";
import {
  vendorCreateProductAction,
  vendorUpdateProductAction,
  vendorDeleteProductAction,
  type VendorProductFormInput,
} from "@/server/vendor-products-actions";
import { useRouter } from "next/navigation";

type Props = {
  products: Product[];
  categories: Category[];
};

type FormState = VendorProductFormInput & { id?: string };

const EMPTY: FormState = {
  name: "",
  categoryId: "",
  price: 0,
  oldPrice: undefined,
  unit: "шт",
  image: "",
  description: "",
  inStock: true,
  weight: "",
};

export function VendorCatalogManager({ products, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [editing, setEditing] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const usedCategoryIds = useMemo(
    () => [...new Set(products.map((p) => p.categoryId))],
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (filterCat !== "all") {
      list = list.filter((p) => p.categoryId === filterCat);
    }
    const q = deferredQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const cat = categoryMap.get(p.categoryId);
        return (
          p.name.toLowerCase().includes(q) ||
          (cat?.name?.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return list;
  }, [products, filterCat, deferredQuery, categoryMap]);

  function openCreate() {
    setEditing({ ...EMPTY, categoryId: categories[0]?.id ?? "" });
    setError(null);
  }

  function openEdit(p: Product) {
    setEditing({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      price: p.price,
      oldPrice: p.oldPrice ?? undefined,
      unit: p.unit,
      image: p.image,
      description: p.description,
      inStock: p.inStock,
      weight: p.weight ?? "",
    });
    setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);

    const input: VendorProductFormInput = {
      name: editing.name,
      categoryId: editing.categoryId,
      price: editing.price,
      oldPrice: editing.oldPrice,
      unit: editing.unit,
      image: editing.image,
      description: editing.description,
      inStock: editing.inStock,
      weight: editing.weight,
    };

    startTransition(async () => {
      const res = editing.id
        ? await vendorUpdateProductAction(editing.id, input)
        : await vendorCreateProductAction(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function handleDelete(p: Product) {
    startTransition(async () => {
      const res = await vendorDeleteProductAction(p.id);
      if (!res.ok) {
        setError(res.error);
      }
      setConfirmDelete(null);
      router.refresh();
    });
  }

  const patch = (key: keyof FormState, val: unknown) =>
    setEditing((s) => (s ? { ...s, [key]: val } : s));

  const inStockCount = products.filter((p) => p.inStock).length;
  const hiddenCount = products.filter((p) => !p.inStock).length;

  return (
    <div className="space-y-3">
      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <Tile label="Категории" value={String(usedCategoryIds.length)} />
        <Tile label="В наличии" value={String(inStockCount)} />
        <Tile label="Скрытые" value={String(hiddenCount)} />
      </section>

      {/* Search + Add */}
      <div className="flex items-center gap-2">
        <label className="relative block flex-1">
          <span className="sr-only">Поиск товаров</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            type="search"
            inputMode="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию или категории"
            className="w-full rounded-2xl border border-ink-200 bg-white py-2.5 pl-9 pr-9 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Очистить поиск"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-800"
            >
              <X size={14} />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={openCreate}
          disabled={pending}
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-brand-500 px-3.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          <span>Добавить</span>
        </button>
      </div>

      {/* Category filter tabs */}
      {usedCategoryIds.length > 1 && (
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Фильтр по категории">
          <FilterTab
            label="Все"
            active={filterCat === "all"}
            onClick={() => setFilterCat("all")}
          />
          {usedCategoryIds.map((cid) => {
            const cat = categoryMap.get(cid);
            if (!cat) return null;
            return (
              <FilterTab
                key={cid}
                label={`${cat.emoji} ${cat.name}`}
                active={filterCat === cid}
                onClick={() => setFilterCat(cid)}
              />
            );
          })}
        </nav>
      )}

      {/* Count */}
      <div className="text-[11px] text-ink-500">
        Найдено: <strong className="text-ink-900">{filtered.length}</strong>{" "}
        из {products.length}
      </div>

      {/* Error */}
      {error && !editing && (
        <div className="rounded-xl bg-red-50 p-3 text-[13px] text-red-700">{error}</div>
      )}

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center">
          <Package size={40} className="mx-auto mb-2 text-ink-300" />
          <p className="text-[14px] font-semibold text-ink-700">
            {products.length === 0
              ? "Товаров пока нет"
              : `Ничего не найдено по запросу «${deferredQuery}»`}
          </p>
          <p className="text-[12px] text-ink-500 mt-1">
            {products.length === 0
              ? "Нажмите «Добавить» чтобы начать"
              : "Попробуйте другой запрос или категорию"}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => {
            const cat = categoryMap.get(p.categoryId);
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-300">
                      <Package size={20} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-ink-900">
                    {p.name}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                    <Badge tone="brand">
                      {SOURCE_SHORT_LABELS[p.source]}
                    </Badge>
                    <span className="truncate">{cat?.name ?? "—"}</span>
                    {p.weight && <span>· {p.weight}</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[13px] font-extrabold text-ink-900">
                      {formatPrice(p.price)}
                    </span>
                    <span className="text-[10px] text-ink-500">
                      / {p.unit}
                    </span>
                    {p.oldPrice ? (
                      <span className="text-[10px] text-ink-400 line-through">
                        {formatPrice(p.oldPrice)}
                      </span>
                    ) : null}
                    {p.inStock ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        В наличии
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        Скрыт
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-700 hover:bg-ink-200"
                    aria-label="Редактировать"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(p)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                    aria-label="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-3">
            <h3 className="text-[16px] font-bold text-ink-900">Удалить товар?</h3>
            <p className="text-[13px] text-ink-600">
              «{confirmDelete.name}» будет удалён безвозвратно.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(confirmDelete)}
                disabled={pending}
              >
                {pending ? "Удаляем…" : "Удалить"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-ink-900">
                {editing.id ? "Редактировать товар" : "Новый товар"}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-full p-1 hover:bg-ink-100"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-[13px] text-red-700">{error}</div>
            )}

            <VendorImagePicker
              value={editing.image}
              onChange={(url) => patch("image", url)}
              label="Фото товара *"
            />

            <Input
              label="Название *"
              value={editing.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="Например: Помидоры бакинские"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Цена (₽) *"
                type="number"
                value={editing.price || ""}
                onChange={(e) => patch("price", Number(e.target.value))}
                placeholder="150"
                required
                min={1}
              />
              <Input
                label="Старая цена (₽)"
                type="number"
                value={editing.oldPrice || ""}
                onChange={(e) =>
                  patch("oldPrice", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Единица *"
                value={editing.unit}
                onChange={(e) => patch("unit", e.target.value)}
                placeholder="кг, шт, порция"
                required
              />
              <Input
                label="Вес/объём"
                value={editing.weight ?? ""}
                onChange={(e) => patch("weight", e.target.value)}
                placeholder="500 г"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">
                Категория *
              </label>
              <select
                value={editing.categoryId}
                onChange={(e) => patch("categoryId", e.target.value)}
                className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-[14px] text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              >
                <option value="">Выберите категорию</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">
                Описание
              </label>
              <textarea
                value={editing.description}
                onChange={(e) => patch("description", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-[14px] text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                placeholder="Краткое описание товара"
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.inStock}
                onChange={(e) => patch("inStock", e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-[13px] text-ink-700">В наличии (видно клиентам)</span>
            </label>

            <Button fullWidth type="submit" disabled={pending}>
              {pending
                ? "Сохраняем…"
                : editing.id
                  ? "Сохранить"
                  : "Добавить товар"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white"
          : "shrink-0 rounded-full bg-ink-100 px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-ink-200"
      }
    >
      {label}
    </button>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-3 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="mt-1 text-[20px] font-extrabold text-ink-900">
        {value}
      </div>
    </div>
  );
}
