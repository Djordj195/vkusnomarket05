"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus, Building2, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  addCourierAction,
  removeCourierAction,
  toggleCourierAction,
} from "@/server/couriers-actions";
import type { Courier, CourierType } from "@/lib/types";

type Filter = "all" | CourierType;

export function CourierManager({
  initialCouriers,
}: {
  initialCouriers: Courier[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [courierType, setCourierType] = useState<CourierType>("platform");
  const [shopId, setShopId] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? initialCouriers
      : initialCouriers.filter((c) => c.courierType === filter);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("phone", phone);
    fd.set("courierType", courierType);
    if (courierType === "shop" && shopId) fd.set("shopId", shopId);
    startTransition(async () => {
      const res = await addCourierAction(fd);
      if (!res.ok) setError(res.error ?? "Ошибка");
      else {
        setName("");
        setPhone("");
        setShopId("");
        router.refresh();
      }
    });
  };

  const toggle = (c: Courier) => {
    startTransition(async () => {
      await toggleCourierAction(c.id, !c.isActive);
      router.refresh();
    });
  };

  const remove = (c: Courier) => {
    startTransition(async () => {
      await removeCourierAction(c.id);
      router.refresh();
    });
  };

  const platformCount = initialCouriers.filter((c) => c.courierType === "platform").length;
  const shopCount = initialCouriers.filter((c) => c.courierType === "shop").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {([
          ["all", `Все (${initialCouriers.length})`],
          ["platform", `Платформы (${platformCount})`],
          ["shop", `Магазина (${shopCount})`],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={
              filter === key
                ? "rounded-full bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                : "rounded-full bg-ink-100 px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-ink-200"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-ink-200 bg-white p-4"
      >
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink-900">
          <UserPlus size={18} />
          Новый курьер
        </h2>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <Input
                label="Телефон"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                error={error ?? undefined}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">
                Тип курьера
              </label>
              <select
                value={courierType}
                onChange={(e) => setCourierType(e.target.value as CourierType)}
                className="w-full rounded-xl border border-ink-200 px-3 py-2 text-[13px]"
              >
                <option value="platform">Курьер платформы</option>
                <option value="shop">Курьер магазина</option>
              </select>
            </div>
            {courierType === "shop" && (
              <div className="flex-1">
                <Input
                  label="ID магазина"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  placeholder="shop-..."
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="sm:w-auto"
            fullWidth
          >
            {pending ? "Добавляем..." : "Сохранить изменения"}
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-ink-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-ink-500">
            Курьеры ещё не добавлены.
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-ink-900">
                      {c.name}
                    </span>
                    {c.courierType === "platform" ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                        <Globe2 size={10} /> Платформа
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Building2 size={10} /> Магазин
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[12px] text-ink-500">
                    {c.phone}
                    {c.shopId && <span className="ml-2 text-ink-400">· {c.shopId}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => toggle(c)}
                  className="shrink-0"
                >
                  {c.isActive ? (
                    <Badge tone="success">Активен</Badge>
                  ) : (
                    <Badge tone="neutral">Не активен</Badge>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(c)}
                  disabled={pending}
                  aria-label="Удалить"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
