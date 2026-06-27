"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqQuestion } from "@/data/faq";

export function FaqAccordion({ questions }: { questions: FaqQuestion[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="mt-4 space-y-2">
      {questions.map((q, i) => {
        const isOpen = open === i;
        return (
          <li
            key={i}
            className="overflow-hidden rounded-2xl border border-ink-200 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-ink-50"
            >
              <span className="flex-1 text-[14px] font-semibold text-ink-900">
                {q.q}
              </span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              >
                <ChevronDown size={16} />
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-ink-100 px-3 py-3 text-[13px] leading-[1.55] text-ink-700">
                {q.a}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
