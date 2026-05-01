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
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 rounded-2xl border border-ink-200 bg-white">
        {initialCouriers.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-ink-500">
            Курьеры ещё не добавлены.
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {initialCouriers.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="font-semibold text-ink-900">{c.name}</div>
                  <div className="text-[12px] text-ink-500">{c.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggle(c)}
                    className="flex items-center"
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
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={submit}
        className="space-y-3 rounded-2xl border border-ink-200 bg-white p-5"
      >
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
          <UserPlus size={18} />
          Новый курьер
        </h2>
        <Input
          label="Имя"
          placeholder="Например, Магомед"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Телефон"
          placeholder="+7 (999) 123-45-67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          error={error ?? undefined}
        />
        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Добавляем..." : "Добавить"}
        </Button>
      </form>
    </div>
  );
}
