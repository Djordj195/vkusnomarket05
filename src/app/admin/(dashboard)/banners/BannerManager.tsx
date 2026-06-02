"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createBannerAction,
  updateBannerAction,
  deleteBannerAction,
  type BannerFormInput,
} from "@/server/banners-actions";
import type { Banner } from "@/server/banners-store";
import { useRouter } from "next/navigation";

type FormState = BannerFormInput & { id?: string };

const EMPTY: FormState = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  cityId: null,
  bgColor: "#7c3aed",
  textColor: "#ffffff",
  isActive: true,
  sortOrder: 0,
  startsAt: null,
  endsAt: null,
};

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Banner | null>(null);

  function openCreate() {
    setError(null);
    setEditing({ ...EMPTY, sortOrder: banners.length });
  }

  function openEdit(b: Banner) {
    setError(null);
    setEditing({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      cityId: b.cityId,
      bgColor: b.bgColor,
      textColor: b.textColor,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    const payload: BannerFormInput = {
      title: editing.title,
      subtitle: editing.subtitle,
      imageUrl: editing.imageUrl,
      linkUrl: editing.linkUrl,
      cityId: editing.cityId,
      bgColor: editing.bgColor,
      textColor: editing.textColor,
      isActive: editing.isActive,
      sortOrder: editing.sortOrder,
      startsAt: editing.startsAt,
      endsAt: editing.endsAt,
    };
    startTransition(async () => {
      const res = editing.id
        ? await updateBannerAction(editing.id, payload)
        : await createBannerAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function doDelete(b: Banner) {
    startTransition(async () => {
      const res = await deleteBannerAction(b.id);
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
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink-700">
          {banners.length} баннер(ов)
        </span>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> Новый баннер
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center text-[13px] text-ink-500">
          Баннеров пока нет. Создайте первый!
        </div>
      ) : (
        <ul className="space-y-3">
          {banners.map((b) => (
            <li
              key={b.id}
              className="overflow-hidden rounded-2xl border border-ink-200"
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ backgroundColor: b.bgColor, color: b.textColor }}
              >
                <div>
                  <div className="text-[16px] font-bold leading-tight">
                    {b.title}
                  </div>
                  {b.subtitle && (
                    <div className="mt-0.5 text-[12px] opacity-80">
                      {b.subtitle}
                    </div>
                  )}
                </div>
                {b.linkUrl && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between bg-white px-4 py-2">
                <div className="flex items-center gap-2 text-[11px] text-ink-500">
                  {b.isActive ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 font-semibold">
                      Активен
                    </span>
                  ) : (
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-ink-500 font-semibold">
                      Выкл
                    </span>
                  )}
                  {b.cityId && <span>Город: {b.cityId}</span>}
                  {b.startsAt && (
                    <span>
                      с {new Date(b.startsAt).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                  {b.endsAt && (
                    <span>
                      до {new Date(b.endsAt).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(b)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 pb-4 sm:items-center sm:pb-0">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-3">
            <h3 className="text-[16px] font-bold text-ink-900">
              Удалить баннер «{confirmDelete.title}»?
            </h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setConfirmDelete(null)}
              >
                Отмена
              </Button>
              <Button
                fullWidth
                onClick={() => doDelete(confirmDelete)}
                disabled={pending}
              >
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/30 pb-4 sm:items-center sm:pb-0">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-ink-900">
                {editing.id ? "Редактировать баннер" : "Новый баннер"}
              </h3>
              <button type="button" onClick={() => setEditing(null)}>
                <X size={18} className="text-ink-500" />
              </button>
            </div>

            <Input
              label="Заголовок"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              required
            />
            <Input
              label="Подзаголовок"
              value={editing.subtitle}
              onChange={(e) =>
                setEditing({ ...editing, subtitle: e.target.value })
              }
            />
            <Input
              label="Ссылка (URL)"
              value={editing.linkUrl}
              onChange={(e) =>
                setEditing({ ...editing, linkUrl: e.target.value })
              }
              placeholder="/weekly или https://..."
            />
            <Input
              label="URL картинки (необязательно)"
              value={editing.imageUrl}
              onChange={(e) =>
                setEditing({ ...editing, imageUrl: e.target.value })
              }
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[12px] font-semibold text-ink-700 mb-1">
                  Цвет фона
                </label>
                <input
                  type="color"
                  value={editing.bgColor}
                  onChange={(e) =>
                    setEditing({ ...editing, bgColor: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-ink-200 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[12px] font-semibold text-ink-700 mb-1">
                  Цвет текста
                </label>
                <input
                  type="color"
                  value={editing.textColor}
                  onChange={(e) =>
                    setEditing({ ...editing, textColor: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-ink-200 cursor-pointer"
                />
              </div>
            </div>
            <Input
              label="ID города (необязательно)"
              value={editing.cityId ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  cityId: e.target.value || null,
                })
              }
              placeholder="city-moscow"
            />
            <label className="flex items-center gap-2 text-[13px] text-ink-700">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) =>
                  setEditing({ ...editing, isActive: e.target.checked })
                }
                className="h-4 w-4"
              />
              Активен
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
                fullWidth
                onClick={() => setEditing(null)}
              >
                Отмена
              </Button>
              <Button type="submit" fullWidth disabled={pending}>
                {pending
                  ? "Сохраняю..."
                  : editing.id
                    ? "Сохранить"
                    : "Создать"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
