"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/store/auth";
import { isValidPhone, maskPhoneInput } from "@/lib/utils";
import { DEMO_SMS_CODE } from "@/lib/constants";

type Step = "phone" | "code";

export default function AuthPage() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setError(null);
    if (!isValidPhone(phone)) {
      setError("Введите корректный номер (+7...).");
      return;
    }
    setLoading(true);
    try {
      // Сейчас демо-режим: код всегда 1234. Когда подключите SMS.ru,
      // здесь будет вызов /api/auth/send-code, который реально отправит SMS.
      await new Promise((r) => setTimeout(r, 600));
      setStep("code");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError(null);
    if (code !== DEMO_SMS_CODE) {
      setError(`Неверный код. В демо-режиме используйте код ${DEMO_SMS_CODE}.`);
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    setUser({
      id: `u-${phoneDigits}`,
      phone: phoneDigits,
      name: name.trim() || undefined,
    });
    router.replace("/profile");
  };

  return (
    <PageShell>
      <Header variant="page" title="Вход" showBack />
      <div className="px-4 pt-4 pb-4 space-y-5">
        <div className="text-center pt-4">
          <div className="text-[24px] font-extrabold leading-tight text-ink-900">
            Вход по номеру телефона
          </div>
          <p className="mt-2 text-[14px] text-ink-500">
            Мы отправим вам SMS с кодом подтверждения.
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
            <Button fullWidth size="lg" onClick={sendCode} disabled={loading}>
              {loading ? "Отправляем..." : "Получить код"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-brand-50 p-3 text-[13px] text-brand-800">
              Код отправлен на номер <strong>{phone}</strong>
            </div>
            <Input
              label="Код из SMS"
              placeholder={DEMO_SMS_CODE}
              inputMode="numeric"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              maxLength={4}
              error={error ?? undefined}
            />
            <Button fullWidth size="lg" onClick={verify}>
              Войти
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
              }}
              className="block w-full text-center text-[13px] text-ink-500 hover:text-ink-800"
            >
              Изменить номер
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
