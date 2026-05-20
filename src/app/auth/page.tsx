"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
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
      // Демо-режим: код всегда 123456. После подключения SMS-провайдера
      // здесь будет вызов /api/auth/send-code, который реально отправит SMS.
      // Факт согласия сохраняется в БД вместе с версией документа, IP и устройством.
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

  const codeLength = DEMO_SMS_CODE.length;

  return (
    <PageShell>
      <Header variant="page" title="Вход или регистрация" showBack />
      <div className="px-4 pt-4 pb-4 space-y-5">
        <div className="text-center pt-4">
          <div className="text-[24px] font-extrabold leading-tight text-ink-900">
            Вход или регистрация
          </div>
          <p className="mt-2 text-[14px] text-ink-500">
            Мы отправим SMS с 6-значным кодом подтверждения.
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
                setCode(e.target.value.replace(/\D/g, "").slice(0, codeLength))
              }
              maxLength={codeLength}
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
            <p className="text-center text-[12px] text-ink-400">
              Не пришёл код? Подождите 60 секунд и нажмите{" "}
              <button
                type="button"
                onClick={sendCode}
                disabled={loading}
                className="font-semibold text-brand-700 hover:underline disabled:text-ink-400"
              >
                отправить снова
              </button>
              .
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
