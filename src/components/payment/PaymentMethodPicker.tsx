"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Banknote,
  Check,
  ChevronDown,
  CreditCard,
  QrCode,
  Smartphone,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ONLINE_PAYMENT_METHODS,
  PAYMENT_LABELS,
  PRIMARY_PAYMENT_METHODS,
  type OnlinePaymentMethod,
  type PaymentMethod,
} from "@/lib/types";

// Иконка + короткая подпись для каждого способа оплаты.
const META: Record<PaymentMethod, { icon: ReactNode; hint: string }> = {
  cash: { icon: <Banknote size={20} />, hint: "Оплата курьеру при получении" },
  card: { icon: <CreditCard size={20} />, hint: "Visa, Mastercard, Мир" },
  sbp: { icon: <QrCode size={20} />, hint: "Мгновенно и без комиссии" },
  sberpay: { icon: <Smartphone size={20} />, hint: "Через СберБанк Онлайн" },
  tpay: { icon: <Smartphone size={20} />, hint: "Через Т-Банк" },
  alfapay: { icon: <Smartphone size={20} />, hint: "Через Альфа-Банк" },
  mirpay: { icon: <Smartphone size={20} />, hint: "Карты Мир через Mir Pay" },
  yoomoney: { icon: <Wallet size={20} />, hint: "Кошелёк ЮMoney" },
};

const OTHER_METHODS: ReadonlyArray<OnlinePaymentMethod> =
  ONLINE_PAYMENT_METHODS.filter((m) => !PRIMARY_PAYMENT_METHODS.includes(m));

export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
}) {
  // Блок «Другие способы оплаты» открыт, если выбран один из них.
  const [othersOpen, setOthersOpen] = useState<boolean>(() =>
    OTHER_METHODS.includes(value as OnlinePaymentMethod)
  );

  return (
    <div className="space-y-3">
      {/* Наличные — отдельная строка сверху. */}
      <PaymentRow
        active={value === "cash"}
        onClick={() => onChange("cash")}
        icon={META.cash.icon}
        label={PAYMENT_LABELS.cash}
        hint={META.cash.hint}
      />

      {/* Основные онлайн-методы — крупные кнопки 2×2. */}
      <div className="grid grid-cols-2 gap-2">
        {PRIMARY_PAYMENT_METHODS.map((m) => (
          <PaymentTile
            key={m}
            active={value === m}
            onClick={() => onChange(m)}
            icon={META[m].icon}
            label={PAYMENT_LABELS[m]}
            hint={META[m].hint}
          />
        ))}
      </div>

      {/* Остальные методы — в раскрывающемся блоке. */}
      <div className="rounded-2xl border border-ink-200 bg-white">
        <button
          type="button"
          onClick={() => setOthersOpen((v) => !v)}
          className="flex w-full items-center justify-between p-3 text-left"
        >
          <span className="text-[14px] font-semibold text-ink-900">
            Другие способы оплаты
          </span>
          <ChevronDown
            size={18}
            className={cn(
              "text-ink-500 transition-transform",
              othersOpen && "rotate-180"
            )}
          />
        </button>
        {othersOpen && (
          <div className="space-y-2 border-t border-ink-100 p-3">
            {OTHER_METHODS.map((m) => (
              <PaymentRow
                key={m}
                active={value === m}
                onClick={() => onChange(m)}
                icon={META[m].icon}
                label={PAYMENT_LABELS[m]}
                hint={META[m].hint}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentTile({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors",
        active ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-white"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          active ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-700"
        )}
      >
        {icon}
      </span>
      <span className="block text-[14px] font-bold text-ink-900">{label}</span>
      <span className="block text-[11px] leading-tight text-ink-500">
        {hint}
      </span>
      {active && (
        <Check size={18} className="absolute right-3 top-3 text-brand-600" />
      )}
    </button>
  );
}

function PaymentRow({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
        active ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-white"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          active ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-700"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-ink-900">
          {label}
        </span>
        <span className="block text-[11px] text-ink-500">{hint}</span>
      </span>
      {active && <Check size={18} className="shrink-0 text-brand-600" />}
    </button>
  );
}
