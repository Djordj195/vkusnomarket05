"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  addCourierAction,
  removeCourierAction,
  toggleCourierAction,
} from "@/server/couriers-actions";
import type { Courier } from "@/lib/types";

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("phone", phone);
    startTransition(async () => {
      const res = await addCourierAction(fd);
      if (!res.ok) setError(res.error ?? "Ошибка");
      else {
        setName("");
        setPhone("");
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

  return (
    <div className="space-y-4">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-ink-200 bg-white p-4"
      >
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink-900">
          <UserPlus size={18} />
          Новый курьер
        </h2>
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
        {initialCouriers.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-ink-500">
            Курьеры ещё не добавлены.
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {initialCouriers.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink-900">
                    {c.name}
                  </div>
                  <div className="truncate text-[12px] text-ink-500">
                    {c.phone}
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
