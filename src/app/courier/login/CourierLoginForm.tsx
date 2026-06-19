"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OtpCodeStep } from "@/components/auth/OtpCodeStep";
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
  const [courierType, setCourierType] = useState<CourierType>("platform");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(60);

  const onSendCode = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!consent) {
      setError("Подтвердите согласие с условиями ниже.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      const res = await sendCourierCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        if (res.retryAfterSec) setCooldownSec(res.retryAfterSec);
        return;
      }
      setDemoCode(res.demoCode);
      setCooldownSec(res.cooldownSec);
      setStep("code");
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [phone, consent]);

  const onVerify = useCallback(async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      fd.set("code", code);
      fd.set("courierType", courierType);
      const res = await verifyCourierCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/courier/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }, [phone, courierType, router]);

  const handleResend = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      const res = await sendCourierCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        if (res.retryAfterSec) setCooldownSec(res.retryAfterSec);
        return;
      }
      setDemoCode(res.demoCode);
      setCooldownSec(res.cooldownSec);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [phone]);

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
        <Button fullWidth size="lg" type="submit" disabled={loading}>
          {loading ? "Отправляем код..." : "Получить код"}
        </Button>
      </form>
    );
  }

  return (
    <OtpCodeStep
      phone={phone}
      demoCode={demoCode}
      cooldownSec={cooldownSec}
      error={error}
      loading={loading}
      onVerify={onVerify}
      onResend={handleResend}
      onChangePhone={() => {
        setStep("phone");
        setError(null);
      }}
      extraInfo={
        <div className="text-[12px] text-brand-700/80 rounded-xl bg-brand-50/50 px-3 py-1.5">
          Тип: {courierType === "platform" ? "Курьер платформы" : "Курьер магазина"}
        </div>
      }
    />
  );
}
