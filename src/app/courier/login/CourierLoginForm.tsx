"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { maskPhoneInput } from "@/lib/utils";
import {
  sendCourierCodeAction,
  verifyCourierCodeAction,
} from "@/server/courier-login-actions";

type Step = "phone" | "code";
type CourierType = "platform" | "shop";

export function CourierLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [courierType, setCourierType] = useState<CourierType>("platform");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Подтвердите согласие с условиями ниже.");
      return;
    }
    const fd = new FormData();
    fd.set("phone", phone);
    startTransition(async () => {
      const res = await sendCourierCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStep("code");
    });
  }

  function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("phone", phone);
    fd.set("code", code);
    fd.set("courierType", courierType);
    startTransition(async () => {
      const res = await verifyCourierCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/courier/dashboard");
      router.refresh();
    });
  }

  if (step === "phone") {
    return (
      <form className="space-y-3" onSubmit={onSendCode}>
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-ink-700">
            Тип курьера
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                {
                  key: "platform",
                  label: "Платформы",
                  sub: "Разные продавцы",
                },
                { key: "shop", label: "Магазина", sub: "Один продавец" },
              ] as const
            ).map((opt) => {
              const selected = courierType === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setCourierType(opt.key)}
                  className={
                    selected
                      ? "rounded-2xl border-2 border-brand-500 bg-brand-50 p-3 text-left"
                      : "rounded-2xl border-2 border-ink-200 bg-white p-3 text-left hover:border-brand-300"
                  }
                  aria-pressed={selected}
                >
                  <div className="text-[13px] font-bold text-ink-900">
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-ink-500">{opt.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Номер телефона"
          placeholder="+7 (___) ___-__-__"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
          error={error ?? undefined}
        />
        <label className="flex items-start gap-2 rounded-xl bg-ink-50 p-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-[12px] leading-snug text-ink-700">
            Я принимаю{" "}
            <Link
              href="/legal/offer"
              className="font-semibold text-brand-700 hover:underline"
            >
              оферту
            </Link>{" "}
            и{" "}
            <Link
              href="/legal/privacy"
              className="font-semibold text-brand-700 hover:underline"
            >
              политику
            </Link>
            .
          </span>
        </label>
        <Button fullWidth size="lg" type="submit" disabled={pending}>
          {pending ? "Отправляем..." : "Получить код"}
        </Button>
      </form>
    );
  }

  return (
    <form className="space-y-3" onSubmit={onVerify}>
      <div className="rounded-xl bg-brand-50 p-3 text-[13px] text-brand-800">
        Код отправлен на номер <strong>{phone}</strong>
        <div className="mt-1 text-[12px] text-brand-700/80">
          Тип: {courierType === "platform" ? "Курьер платформы" : "Курьер магазина"}
        </div>
      </div>
      <Input
        label="Код из SMS"
        placeholder="123456"
        inputMode="numeric"
        value={code}
        onChange={(e) =>
          setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        maxLength={6}
        error={error ?? undefined}
      />
      <Button fullWidth size="lg" type="submit" disabled={pending}>
        {pending ? "Проверяем..." : "Начать смену"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setCode("");
          setError(null);
        }}
        className="block w-full text-center text-[13px] text-ink-500 hover:text-ink-800"
      >
        Изменить номер
      </button>
    </form>
  );
}
