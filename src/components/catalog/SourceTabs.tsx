"use client";

import { cn } from "@/lib/utils";
import { SOURCE_SHORT_LABELS, type SourceType } from "@/lib/types";

const TABS: { id: SourceType; label: string }[] = [
  { id: "market", label: SOURCE_SHORT_LABELS.market },
  { id: "shop", label: SOURCE_SHORT_LABELS.shop },
  { id: "food", label: SOURCE_SHORT_LABELS.food },
];

export function SourceTabs({
  active,
  onChange,
}: {
  active: SourceType;
  onChange: (s: SourceType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-ink-100 p-1">
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all",
              isActive
                ? "bg-white text-brand-700 shadow-sm"
                : "text-ink-600 hover:text-ink-900"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
