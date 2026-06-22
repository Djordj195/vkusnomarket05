"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { VendorOtpLoginForm } from "./VendorOtpLoginForm";
import { LoginForm } from "./LoginForm";

const TABS = [
  { key: "phone", label: "По телефону" },
  { key: "password", label: "По логину" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function VendorLoginTabs() {
  const [tab, setTab] = useState<Tab>("phone");

  return (
    <div className="space-y-4">
      <div className="flex rounded-xl bg-ink-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition",
              tab === t.key
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-500 hover:text-ink-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "phone" ? <VendorOtpLoginForm /> : <LoginForm />}
    </div>
  );
}
