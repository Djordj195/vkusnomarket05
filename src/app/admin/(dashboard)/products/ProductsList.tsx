"use client";

import Image from "next/image";
import {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { Category, Product, SourceType } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { formatPrice } from "@/lib/utils";
import { SOURCE_LABELS, SOURCE_SHORT_LABELS } from "@/lib/types";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
  type ProductFormInput,
} from "@/server/products-actions";
import { useRouter } from "next/navigation";

type Props = {
  products: Product[];
  categories: Category[];
  dbConfigured: boolean;
};

type FormState = ProductFormInput & { id?: string };

const EMPTY: FormState = {
  slug: "",
  name: "",
  source: "market",
  categoryId: "",
  shopId: "",
  price: 0,
  oldPrice: undefined,
  unit: "шт",
  image: "",
  description: "",
  inStock: true,
  weight: "",
  isWeekly: false,
};

export function ProductsList({ products, categories, dbConfigured }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const cat = categoryMap.get(p.categoryId);
      return (
        p.name.toLowerCase().includes(q) ||
        (cat?.name?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, deferredQuery, categoryMap]);

  function openCreate() {
    setError(null);
    setEditing({
      ...EMPTY,
      categoryId: categories[0]?.id ?? "",
      source: categories[0]?.source ?? "market",
    });
  }

  function openEdit(p: Product) {
    setError(null);
    setEditing({
      id: p.id,
      slug: p.slug,
      name: p.name,
      source: p.source,
      categoryId: p.categoryId,
      shopId: p.shopId ?? "",
      price: p.price,
      oldPrice: p.oldPrice,
      unit: p.unit,
      image: p.image,
      description: p.description,
      inStock: p.inStock,
      weight: p.weight ?? "",
      isWeekly: p.isWeekly ?? false,
    });
  }

  function close() {
    setEditing(null);
    setError(null);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    const payload: ProductFormInput = {
      slug: editing.slug,
      name: editing.name,
      source: editing.source,
      categoryId: editing.categoryId,
      shopId: editing.shopId?.trim() ? editing.shopId : undefined,
      price: editing.price,
      oldPrice: editing.oldPrice,
      unit: editing.unit,
      image: editing.image,
      description: editing.description,
      inStock: editing.inStock,
      weight: editing.weight?.trim() ? editing.weight : undefined,
      isWeekly: editing.isWeekly,
    };

    startTransition(async () => {
      const res = editing.id
        ? await updateProductAction(editing.id, payload)
        : await createProductAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function doDelete(p: Product) {
    startTransition(async () => {
      const res = await deleteProductAction(p.id);
      if (!res.ok) {
        setError(res.error);
        setConfirmDelete(null);
        return;
      }
      setConfirmDelete(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
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
          disabled={!dbConfigured || pending}
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-brand-500 px-3.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          <span>Добавить</span>
        </button>
      </div>

      <div className="text-[11px] text-ink-500">
        Найдено: <strong className="text-ink-900">{filtered.length}</strong>{" "}
        из {products.length}
      </div>

      {error && !editing && (
        <div className="rounded-2xl bg-red-50 p-3 text-[12px] text-red-800">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center text-[13px] text-ink-500">
          {products.length === 0
            ? "Товаров пока нет. Нажмите «Добавить»."
            : `Ничего не найдено по запросу «${deferredQuery}».`}
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
                    {p.inStock ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        В наличии
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        Нет
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    disabled={!dbConfigured || pending}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-700 hover:bg-ink-200 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Редактировать"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(p)}
                    disabled={!dbConfigured || pending}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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

      {editing && (
        <Modal title={editing.id ? "Редактировать товар" : "Новый товар"} onClose={close}>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Название">
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                required
                className={inputCls}
              />
            </Field>

            <Field label="Slug (латиницей)">
              <input
                value={editing.slug}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, ""),
                  })
                }
                required
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Цена, ₽">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={editing.price}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      price: Number(e.target.value) || 0,
                    })
                  }
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Старая цена (если скидка)">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={editing.oldPrice ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      oldPrice:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value) || 0,
                    })
                  }
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Единица">
                <input
                  value={editing.unit}
                  onChange={(e) =>
                    setEditing({ ...editing, unit: e.target.value })
                  }
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Вес/объём (опц.)">
                <input
                  value={editing.weight ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, weight: e.target.value })
                  }
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Раздел">
              <div className="flex gap-1.5">
                {(["market", "shop", "food"] as SourceType[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEditing({ ...editing, source: s })}
                    className={`flex-1 rounded-xl border px-2 py-2 text-[12px] font-semibold ${
                      editing.source === s
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-ink-200 bg-white text-ink-700"
                    }`}
                  >
                    {SOURCE_LABELS[s]}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Категория">
              <select
                value={editing.categoryId}
                onChange={(e) =>
                  setEditing({ ...editing, categoryId: e.target.value })
                }
                required
                className={inputCls}
              >
                <option value="" disabled>
                  Выберите категорию
                </option>
                {categories
                  .filter((c) => c.source === editing.source)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji ? `${c.emoji} ` : ""}{c.name}
                    </option>
                  ))}
              </select>
            </Field>

            <ImagePicker
              label="Фото товара"
              value={editing.image}
              onChange={(url) => setEditing({ ...editing, image: url })}
              folder="products"
              required
            />

            <Field label="Описание">
              <textarea
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                rows={3}
                className={inputCls}
              />
            </Field>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-[13px] text-ink-700">
                <input
                  type="checkbox"
                  checked={editing.inStock}
                  onChange={(e) =>
                    setEditing({ ...editing, inStock: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                В наличии
              </label>
              <label className="flex items-center gap-2 text-[13px] text-ink-700">
                <input
                  type="checkbox"
                  checked={editing.isWeekly}
                  onChange={(e) =>
                    setEditing({ ...editing, isWeekly: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                Товар недели
              </label>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={close}
                fullWidth
              >
                Отмена
              </Button>
              <Button type="submit" fullWidth disabled={pending}>
                {pending
                  ? "Сохранение..."
                  : editing.id
                  ? "Сохранить изменения"
                  : "Создать"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Удалить товар?" onClose={() => setConfirmDelete(null)}>
          <div className="space-y-3">
            <p className="text-[14px] text-ink-700">
              Товар <strong>«{confirmDelete.name}»</strong> будет удалён без
              возможности восстановления.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(null)}
                fullWidth
              >
                Отмена
              </Button>
              <button
                type="button"
                onClick={() => doDelete(confirmDelete)}
                disabled={pending}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-[14px] font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {pending ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-ink-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-3xl"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[16px] font-extrabold text-ink-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-ink-700 hover:bg-ink-200"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
