"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Pencil, Plus, Search, Store, Trash2, X } from "lucide-react";
import type { Shop, SourceType } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SOURCE_LABELS, SOURCE_SHORT_LABELS } from "@/lib/types";
import {
  createShopAction,
  deleteShopAction,
  updateShopAction,
  type ShopFormInput,
} from "@/server/shops-actions";
import { useRouter } from "next/navigation";

type Props = {
  shops: Shop[];
  productCounts: Record<string, number>;
  dbConfigured: boolean;
};

type FormState = ShopFormInput & { id?: string };

const EMPTY: FormState = {
  slug: "",
  name: "",
  source: "shop",
  description: "",
  cover: "",
  rating: undefined,
  isOpen: true,
};

export function ShopsList({ shops, productCounts, dbConfigured }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Shop | null>(null);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  }, [shops, deferredQuery]);

  function openCreate() {
    setError(null);
    setEditing({ ...EMPTY });
  }

  function openEdit(s: Shop) {
    setError(null);
    setEditing({
      id: s.id,
      slug: s.slug,
      name: s.name,
      source: s.source,
      description: s.description ?? "",
      cover: s.cover ?? "",
      rating: s.rating,
      isOpen: s.isOpen ?? true,
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
    const payload: ShopFormInput = {
      slug: editing.slug,
      name: editing.name,
      source: editing.source,
      description: editing.description,
      cover: editing.cover,
      rating: editing.rating,
      isOpen: editing.isOpen,
    };

    startTransition(async () => {
      const res = editing.id
        ? await updateShopAction(editing.id, payload)
        : await createShopAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function doDelete(s: Shop) {
    startTransition(async () => {
      const res = await deleteShopAction(s.id);
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
      {!dbConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-snug text-amber-800">
          <strong>База данных не подключена.</strong> Добавление и
          редактирование магазинов недоступно.
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="relative block flex-1">
          <span className="sr-only">Поиск магазинов</span>
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
            placeholder="Поиск по названию"
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
        Найдено: <strong className="text-ink-900">{filtered.length}</strong> из{" "}
        {shops.length}
      </div>

      {error && !editing && (
        <div className="rounded-2xl bg-red-50 p-3 text-[12px] text-red-800">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white py-12 text-center">
          <Store size={28} className="text-ink-400" />
          <h2 className="mt-3 text-[15px] font-bold text-ink-900">
            {shops.length === 0
              ? "Магазинов пока нет"
              : "Ничего не найдено"}
          </h2>
          <p className="mt-1 max-w-sm px-4 text-[12px] text-ink-500">
            {shops.length === 0
              ? "Добавляйте сюда продавцов, кафе и рестораны — они появятся в разделе «Лавки» у клиентов."
              : `Нет магазинов по запросу «${deferredQuery}».`}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink-100">
                {s.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.cover}
                    alt={s.name}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <Store size={20} className="text-ink-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-ink-900">
                  {s.name}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                  <Badge tone="brand">{SOURCE_SHORT_LABELS[s.source]}</Badge>
                  <span className="truncate">/{s.slug}</span>
                  <span>· {productCounts[s.id] ?? 0} товаров</span>
                  {s.isOpen === false && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      Закрыто
                    </span>
                  )}
                </div>
                {s.description && (
                  <div className="mt-1 truncate text-[11px] text-ink-500">
                    {s.description}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  disabled={!dbConfigured || pending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-700 hover:bg-ink-200 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Редактировать"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(s)}
                  disabled={!dbConfigured || pending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal
          title={editing.id ? "Редактировать магазин" : "Новый магазин"}
          onClose={close}
        >
          <form onSubmit={submit} className="space-y-3">
            <Field label="Название">
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                placeholder="Например, Лавка «У Магомеда»"
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
                placeholder="lavka-u-magomeda"
                required
                className={inputCls}
              />
            </Field>

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

            <Field label="Описание">
              <textarea
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                rows={2}
                placeholder="Свежие овощи и фрукты с местного рынка"
                className={inputCls}
              />
            </Field>

            <Field label="Ссылка на обложку (URL)">
              <input
                type="url"
                value={editing.cover}
                onChange={(e) =>
                  setEditing({ ...editing, cover: e.target.value })
                }
                placeholder="https://..."
                className={inputCls}
              />
              {editing.cover && (
                <div className="relative mt-2 h-28 w-full overflow-hidden rounded-xl bg-ink-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editing.cover}
                    alt="превью"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </Field>

            <Field label="Рейтинг (0–5, опц.)">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0}
                max={5}
                value={editing.rating ?? ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    rating:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
                placeholder="4.7"
                className={inputCls}
              />
            </Field>

            <label className="flex items-center gap-2 text-[13px] text-ink-700">
              <input
                type="checkbox"
                checked={editing.isOpen}
                onChange={(e) =>
                  setEditing({ ...editing, isOpen: e.target.checked })
                }
                className="h-4 w-4"
              />
              Открыто (принимает заказы)
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={close} fullWidth>
                Отмена
              </Button>
              <Button type="submit" fullWidth disabled={pending}>
                {pending
                  ? "Сохранение..."
                  : editing.id
                  ? "Сохранить"
                  : "Создать"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Удалить магазин?" onClose={() => setConfirmDelete(null)}>
          <div className="space-y-3">
            <p className="text-[14px] text-ink-700">
              Магазин <strong>«{confirmDelete.name}»</strong> будет удалён.
              {(productCounts[confirmDelete.id] ?? 0) > 0 && (
                <>
                  {" "}
                  Его товары (<strong>{productCounts[confirmDelete.id]}</strong>
                  ) останутся в каталоге, но без привязки к магазину.
                </>
              )}
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
