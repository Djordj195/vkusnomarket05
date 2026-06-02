"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, Trash2, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createTariffAction,
  updateTariffAction,
  deleteTariffAction,
  type TariffFormInput,
} from "@/server/tariffs-actions";
import type { Tariff } from "@/server/tariffs-store";
import { useRouter } from "next/navigation";

type FormState = TariffFormInput & { id?: string };

const EMPTY: FormState = {
  name: "",
  feePercent: 10,
  description: "",
  minRevenue: null,
  isDefault: false,
  sortOrder: 0,
};

export function TariffsList({ tariffs }: { tariffs: Tariff[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tariff | null>(null);

  function openCreate() {
    setError(null);
    setEditing({ ...EMPTY, sortOrder: tariffs.length });
  }

  function openEdit(t: Tariff) {
    setError(null);
    setEditing({
      id: t.id,
      name: t.name,
      feePercent: t.feePercent,
      description: t.description,
      minRevenue: t.minRevenue,
      isDefault: t.isDefault,
      sortOrder: t.sortOrder,
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    const payload: TariffFormInput = {
      name: editing.name,
      feePercent: editing.feePercent,
      description: editing.description,
      minRevenue: editing.minRevenue,
      isDefault: editing.isDefault,
      sortOrder: editing.sortOrder,
    };
    startTransition(async () => {
      const res = editing.id
        ? await updateTariffAction(editing.id, payload)
        : await createTariffAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function doDelete(t: Tariff) {
    startTransition(async () => {
      const res = await deleteTariffAction(t.id);
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
          {tariffs.length} тариф(ов)
        </span>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> Новый тариф
        </Button>
      </div>

      <ul className="space-y-2">
        {tariffs.map((t) => (
          <li
            key={t.id}
            className="rounded-2xl border border-ink-200 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Wallet size={18} />
                </span>
                <div>
                  <div className="text-[14px] font-bold text-ink-900">
                    {t.name}
                    {t.isDefault && (
                      <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-700">
                        по умолчанию
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    {t.description}
                  </div>
                  {t.minRevenue != null && (
                    <div className="text-[10px] text-ink-400">
                      от {t.minRevenue.toLocaleString("ru-RU")} ₽/мес
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  {t.feePercent}%
                </span>
                <button
                  type="button"
                  onClick={() => openEdit(t)}
                  className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(t)}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 pb-4 sm:items-center sm:pb-0">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-3">
            <h3 className="text-[16px] font-bold text-ink-900">
              Удалить тариф «{confirmDelete.name}»?
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(null)}>
                Отмена
              </Button>
              <Button fullWidth onClick={() => doDelete(confirmDelete)} disabled={pending}>
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 pb-4 sm:items-center sm:pb-0">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-ink-900">
                {editing.id ? "Редактировать тариф" : "Новый тариф"}
              </h3>
              <button type="button" onClick={() => setEditing(null)}>
                <X size={18} className="text-ink-500" />
              </button>
            </div>

            <Input
              label="Название"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              required
            />
            <Input
              label="Комиссия (%)"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={editing.feePercent}
              onChange={(e) =>
                setEditing({ ...editing, feePercent: parseFloat(e.target.value) || 0 })
              }
              required
            />
            <Input
              label="Описание"
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
            <Input
              label="Мин. оборот (₽/мес, необязательно)"
              type="number"
              min={0}
              value={editing.minRevenue ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  minRevenue: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />
            <label className="flex items-center gap-2 text-[13px] text-ink-700">
              <input
                type="checkbox"
                checked={editing.isDefault}
                onChange={(e) =>
                  setEditing({ ...editing, isDefault: e.target.checked })
                }
                className="h-4 w-4"
              />
              Тариф по умолчанию
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" fullWidth onClick={() => setEditing(null)}>
                Отмена
              </Button>
              <Button type="submit" fullWidth disabled={pending}>
                {pending ? "Сохраняю..." : editing.id ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
