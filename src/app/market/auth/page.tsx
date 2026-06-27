"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Logo } from "@/components/layout/Logo";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OtpCodeStep } from "@/components/auth/OtpCodeStep";
import { useAuth } from "@/store/auth";
import { isValidPhone, maskPhoneInput } from "@/lib/utils";
import {
  sendClientCodeAction,
  verifyClientCodeAction,
} from "@/server/client-login-actions";

type Step = "phone" | "code";

export default function AuthPage() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [cooldownSec, setCooldownSec] = useState(60);
  const [method, setMethod] = useState<"sms" | "call" | "demo">("sms");

  const sendCode = useCallback(async () => {
    setError(null);
    if (!isValidPhone(phone)) {
      setError("Введите корректный номер (+7...).");
      return;
    }
    if (!consent) {
      setError("Подтвердите согласие с условиями ниже.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      const res = await sendClientCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        if (res.retryAfterSec) setCooldownSec(res.retryAfterSec);
        return;
      }
      setDemoCode(res.demoCode);
      setCooldownSec(res.cooldownSec);
      setMethod(res.method);
      setStep("code");
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [phone, consent]);

  const verify = useCallback(async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      fd.set("code", code);
      const res = await verifyClientCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setUser({
        id: `u-${res.phone}`,
        phone: res.phone,
        name: name.trim() || undefined,
      });
      router.replace("/market/profile");
    } finally {
      setLoading(false);
    }
  }, [phone, name, setUser, router]);

  const handleResend = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      const res = await sendClientCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        if (res.retryAfterSec) setCooldownSec(res.retryAfterSec);
        return;
      }
      setDemoCode(res.demoCode);
      setCooldownSec(res.cooldownSec);
      setMethod(res.method);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  return (
    <PageShell>
      <Header variant="page" title="Вход или регистрация" showBack />
      <div className="px-4 pt-4 pb-4 space-y-5">
        <div className="text-center pt-4 space-y-3">
          <Logo size={48} className="justify-center" />
          <div className="text-[24px] font-extrabold leading-tight text-ink-900">
            Вход или регистрация
          </div>
          <p className="text-[14px] text-ink-500">
            Мы отправим код подтверждения по SMS или звонком.
          </p>
        </div>

        {step === "phone" ? (
          <div className="space-y-3">
            <Input
              label="Имя (необязательно)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
            />
            <Input
              label="Номер телефона"
              placeholder="+7 (___) ___-__-__"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
              autoComplete="tel"
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
                </Link>
                ,{" "}
                <Link
                  href="/legal/privacy"
                  className="font-semibold text-brand-700 hover:underline"
                >
                  политику конфиденциальности
                </Link>{" "}
                и{" "}
                <Link
                  href="/legal/consent"
                  className="font-semibold text-brand-700 hover:underline"
                >
                  согласие на обработку персональных данных
                </Link>
                .
              </span>
            </label>
            <Button fullWidth size="lg" onClick={sendCode} disabled={loading}>
              {loading ? "Отправляем код..." : "Получить код"}
            </Button>
          </div>
        ) : (
          <OtpCodeStep
            phone={phone}
            demoCode={demoCode}
            cooldownSec={cooldownSec}
            method={method}
            error={error}
            loading={loading}
            onVerify={verify}
            onResend={handleResend}
            onChangePhone={() => {
              setStep("phone");
              setError(null);
            }}
          />
        )}
      </div>
    </PageShell>
  );
}
