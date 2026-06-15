"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  Pencil,
  Phone,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Truck,
  X,
  MessageCircle,
} from "lucide-react";
import type { Courier } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  vendorAddCourierAction,
  vendorUpdateCourierAction,
  vendorToggleCourierAction,
  vendorRemoveCourierAction,
} from "@/server/vendor-couriers-actions";
import { useRouter } from "next/navigation";

type Props = {
  couriers: Courier[];
};

type FormState = {
  id?: string;
  name: string;
  phone: string;
};

const EMPTY: FormState = { name: "", phone: "" };

export function VendorCourierManager({ couriers }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Courier | null>(null);

  function openAdd() {
    setEditing({ ...EMPTY });
    setError(null);
  }

  function openEdit(c: Courier) {
    setEditing({ id: c.id, name: c.name, phone: c.phone });
    setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);

    startTransition(async () => {
      const res = editing.id
        ? await vendorUpdateCourierAction(editing.id, editing.name, editing.phone)
        : await vendorAddCourierAction(editing.name, editing.phone);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function handleDelete(c: Courier) {
    startTransition(async () => {
      const res = await vendorRemoveCourierAction(c.id);
      if (!res.ok) setError(res.error);
      setConfirmDelete(null);
      router.refresh();
    });
  }

  function handleToggle(c: Courier) {
    startTransition(async () => {
      await vendorToggleCourierAction(c.id, !c.isActive);
      router.refresh();
    });
  }

  const activeCount = couriers.filter((c) => c.isActive).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-ink-200 bg-white p-3 text-center">
          <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
            Всего
          </div>
          <div className="mt-1 text-[20px] font-extrabold text-ink-900">
            {couriers.length}
          </div>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-3 text-center">
          <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
            Активные
          </div>
          <div className="mt-1 text-[20px] font-extrabold text-green-600">
            {activeCount}
          </div>
        </div>
      </section>

      <Button fullWidth onClick={openAdd}>
        <Plus size={16} className="mr-1" /> Добавить курьера
      </Button>

      {error && !editing && (
        <div className="rounded-xl bg-red-50 p-3 text-[13px] text-red-700">{error}</div>
      )}

      {couriers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center">
          <Truck size={40} className="mx-auto mb-2 text-ink-300" />
          <p className="text-[14px] font-semibold text-ink-700">Курьеров пока нет</p>
          <p className="text-[12px] text-ink-500 mt-1">
            Добавьте курьера, чтобы назначать ему заказы
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {couriers.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-ink-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 shrink-0">
                  <Truck size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[14px] font-bold text-ink-900">
                      {c.name}
                    </span>
                    {!c.isActive && <Badge tone="neutral">Неактивен</Badge>}
                  </div>
                  <div className="text-[12px] text-ink-500">{c.phone}</div>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(c)}
                    className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    title={c.isActive ? "Деактивировать" : "Активировать"}
                  >
                    {c.isActive ? (
                      <ToggleRight size={18} className="text-green-600" />
                    ) : (
                      <ToggleLeft size={18} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(c)}
                    className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Contact buttons */}
              <div className="mt-3 flex gap-2">
                <a
                  href={`tel:${c.phone.replace(/\D/g, "")}`}
                  className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2 text-[12px] font-semibold text-green-700 hover:bg-green-100"
                >
                  <Phone size={14} /> Позвонить
                </a>
                <a
                  href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^8/, "7")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2 text-[12px] font-semibold text-green-700 hover:bg-green-100"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a
                  href={`https://t.me/+${c.phone.replace(/\D/g, "").replace(/^8/, "7")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <MessageCircle size={14} /> Telegram
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-3">
            <h3 className="text-[16px] font-bold text-ink-900">Удалить курьера?</h3>
            <p className="text-[13px] text-ink-600">
              «{confirmDelete.name}» будет удалён из списка.
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

      {/* Add/Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-ink-900">
                {editing.id ? "Редактировать курьера" : "Новый курьер"}
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

            <Input
              label="Имя курьера *"
              value={editing.name}
              onChange={(e) => setEditing((s) => (s ? { ...s, name: e.target.value } : s))}
              placeholder="Иван Иванов"
              required
            />

            <Input
              label="Телефон *"
              value={editing.phone}
              onChange={(e) => setEditing((s) => (s ? { ...s, phone: e.target.value } : s))}
              placeholder="+7 (999) 123-45-67"
              inputMode="tel"
              required
            />

            <Button fullWidth type="submit" disabled={pending}>
              {pending
                ? "Сохраняем…"
                : editing.id
                  ? "Сохранить"
                  : "Добавить курьера"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
