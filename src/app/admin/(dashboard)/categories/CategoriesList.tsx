"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { Category, SourceType } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SOURCE_LABELS, SOURCE_SHORT_LABELS } from "@/lib/types";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type CategoryFormInput,
} from "@/server/categories-actions";
import { useRouter } from "next/navigation";

type Props = {
  categories: Category[];
  productCounts: Record<string, number>;
  dbConfigured: boolean;
};

type FormState = CategoryFormInput & { id?: string };

const EMPTY: FormState = {
  slug: "",
  name: "",
  source: "market",
  emoji: "🏷️",
  icon: "tag",
  highlight: false,
};

export function CategoriesList({
  categories,
  productCounts,
  dbConfigured,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [categories, deferredQuery]);

  function openCreate() {
    setError(null);
    setEditing({ ...EMPTY });
  }

  function openEdit(c: Category) {
    setError(null);
    setEditing({
      id: c.id,
      slug: c.slug,
      name: c.name,
      source: c.source,
      emoji: c.emoji,
      icon: c.icon,
      highlight: c.highlight ?? false,
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
    const payload: CategoryFormInput = {
      slug: editing.slug,
      name: editing.name,
      source: editing.source,
      emoji: editing.emoji,
      icon: editing.icon,
      highlight: editing.highlight,
    };

    startTransition(async () => {
      const res = editing.id
        ? await updateCategoryAction(editing.id, payload)
        : await createCategoryAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function doDelete(c: Category) {
    startTransition(async () => {
      const res = await deleteCategoryAction(c.id);
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
          редактирование категорий недоступно.
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="relative block flex-1">
          <span className="sr-only">Поиск категорий</span>
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
        {categories.length}
      </div>

      {error && !editing && (
        <div className="rounded-2xl bg-red-50 p-3 text-[12px] text-red-800">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center text-[13px] text-ink-500">
          {categories.length === 0
            ? "Категорий пока нет. Нажмите «Добавить»."
            : `Ничего не найдено по запросу «${deferredQuery}».`}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-[26px]">
                {c.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-ink-900">
                  {c.name}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                  <Badge tone="brand">{SOURCE_SHORT_LABELS[c.source]}</Badge>
                  <span className="truncate">/{c.slug}</span>
                  <span>· {productCounts[c.id] ?? 0} товаров</span>
                  {c.highlight && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      На главной
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  disabled={!dbConfigured || pending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-700 hover:bg-ink-200 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Редактировать"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(c)}
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
          title={editing.id ? "Редактировать категорию" : "Новая категория"}
          onClose={close}
        >
          <form onSubmit={submit} className="space-y-3">
            <Field label="Эмоджи">
              <input
                value={editing.emoji}
                onChange={(e) =>
                  setEditing({ ...editing, emoji: e.target.value })
                }
                placeholder="🥕"
                maxLength={4}
                required
                className={`${inputCls} text-center text-[24px]`}
              />
            </Field>

            <Field label="Название">
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                placeholder="Например, Овощи и фрукты"
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
                placeholder="ovoshchi-frukty"
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

            <label className="flex items-center gap-2 text-[13px] text-ink-700">
              <input
                type="checkbox"
                checked={editing.highlight}
                onChange={(e) =>
                  setEditing({ ...editing, highlight: e.target.checked })
                }
                className="h-4 w-4"
              />
              Показывать на главной (популярная)
            </label>

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
                  ? "Сохранить"
                  : "Создать"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title="Удалить категорию?"
          onClose={() => setConfirmDelete(null)}
        >
          <div className="space-y-3">
            <p className="text-[14px] text-ink-700">
              Категория <strong>«{confirmDelete.name}»</strong> будет удалена.
              {(productCounts[confirmDelete.id] ?? 0) > 0 && (
                <>
                  {" "}
                  Внутри неё <strong>
                    {productCounts[confirmDelete.id]} товаров
                  </strong>{" "}
                  — удаление будет отклонено, пока вы не перенесёте/удалите их.
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
