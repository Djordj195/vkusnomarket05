"use client";

import Image from "next/image";
import {
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Pencil, Plus, Trash2, X, Package, ToggleLeft, ToggleRight } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VendorImagePicker } from "@/components/vendor/VendorImagePicker";
import { formatPrice } from "@/lib/utils";
import {
  vendorCreateProductAction,
  vendorUpdateProductAction,
  vendorDeleteProductAction,
  vendorToggleStockAction,
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
  const [editing, setEditing] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  function openCreate() {
    setEditing({ ...EMPTY });
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

  function handleToggleStock(p: Product) {
    startTransition(async () => {
      await vendorToggleStockAction(p.id, !p.inStock);
      router.refresh();
    });
  }

  const patch = (key: keyof FormState, val: unknown) =>
    setEditing((s) => (s ? { ...s, [key]: val } : s));

  const inStockCount = products.filter((p) => p.inStock).length;
  const hiddenCount = products.filter((p) => !p.inStock).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <Tile label="Категории" value={String(new Set(products.map((p) => p.categoryId)).size)} />
        <Tile label="Товары" value={String(inStockCount)} />
        <Tile label="Скрытые" value={String(hiddenCount)} />
      </section>

      {/* Add button */}
      <Button fullWidth onClick={openCreate}>
        <Plus size={16} className="mr-1" /> Добавить товар
      </Button>

      {/* Error */}
      {error && !editing && (
        <div className="rounded-xl bg-red-50 p-3 text-[13px] text-red-700">{error}</div>
      )}

      {/* Product list */}
      {products.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center">
          <Package size={40} className="mx-auto mb-2 text-ink-300" />
          <p className="text-[14px] font-semibold text-ink-700">Товаров пока нет</p>
          <p className="text-[12px] text-ink-500 mt-1">
            Нажмите «Добавить товар» чтобы начать
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
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
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-bold text-ink-900">
                    {p.name}
                  </span>
                  {!p.inStock && <Badge tone="neutral">Скрыт</Badge>}
                </div>
                <div className="text-[12px] text-ink-500">
                  {formatPrice(p.price)}
                  {p.oldPrice ? (
                    <span className="ml-1 line-through">{formatPrice(p.oldPrice)}</span>
                  ) : null}
                  {" · "}
                  {p.unit}
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleStock(p)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  title={p.inStock ? "Скрыть" : "Показать"}
                >
                  {p.inStock ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(p)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
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
