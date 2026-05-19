"use client";

import { useState, useTransition } from "react";
import type { City, CityStatus } from "@/lib/types";
import { updateCityStatusAction } from "@/server/cities-actions";

const STATUS_LABELS: Record<CityStatus, string> = {
  active: "Активен",
  coming_soon: "Скоро",
  disabled: "Отключён",
};

const STATUS_TONES: Record<CityStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  coming_soon: "bg-amber-100 text-amber-800",
  disabled: "bg-ink-200 text-ink-700",
};

export function CityRow({ city }: { city: City }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CityStatus>(city.status);

  function setNewStatus(next: CityStatus) {
    if (next === status) return;
    setError(null);
    const fd = new FormData();
    fd.set("cityId", city.id);
    fd.set("status", next);
    startTransition(async () => {
      const res = await updateCityStatusAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStatus(next);
    });
  }

  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-ink-900">{city.name}</h3>
            <span
              className={`rounded-full ${STATUS_TONES[status]} px-2 py-0.5 text-[10px] font-semibold`}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-ink-500">
            {city.region}
            {city.population
              ? ` · ${city.population.toLocaleString("ru-RU")} чел.`
              : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {(["active", "coming_soon", "disabled"] as CityStatus[]).map((s) => {
          const isCurrent = s === status;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setNewStatus(s)}
              disabled={pending || isCurrent}
              className={
                isCurrent
                  ? "rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                  : "rounded-lg bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-700 hover:bg-ink-200 disabled:opacity-50"
              }
            >
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-2 text-[11px] text-red-600">{error}</p>
      )}
    </li>
  );
}
