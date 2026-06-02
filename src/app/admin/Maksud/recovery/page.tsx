"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { maskPhoneInput } from "@/lib/utils";
import {
  sendAdminRecoveryCode,
  verifyAdminRecoveryCode,
} from "@/server/admin-recovery-actions";
import { KeyRound } from "lucide-react";

type Step = "phone" | "code";

export default function AdminRecoveryPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const sendCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      const res = await sendAdminRecoveryCode(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMaskedPhone(res.maskedPhone);
      setDemoCode(res.demoCode);
      setStep("code");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("code", code);
      const res = await verifyAdminRecoveryCode(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell className="bg-white">
      <div className="px-4 pt-8 pb-4 space-y-5">
        <div className="text-center pt-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <KeyRound size={26} />
          </div>
          <h1 className="mt-4 text-[22px] font-extrabold text-ink-900">
            Восстановление доступа
          </h1>
          <p className="mt-2 text-[13px] text-ink-500">
            Введите номер телефона администратора. Мы отправим SMS-код для входа.
          </p>
        </div>

        {step === "phone" ? (
          <div className="space-y-3">
            <Input
              label="Номер телефона администратора"
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
              Код отправлен на номер <strong>{maskedPhone}</strong>
            </div>
            {demoCode && (
              <div className="rounded-xl bg-amber-50 p-3 text-[13px] text-amber-800">
                Демо-режим: код <strong>{demoCode}</strong>
              </div>
            )}
            <Input
              label="Код из SMS"
              placeholder="______"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              autoComplete="one-time-code"
              error={error ?? undefined}
            />
            <Button fullWidth size="lg" onClick={verify} disabled={loading}>
              {loading ? "Проверяем..." : "Войти"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="w-full text-center text-[13px] text-brand-600 underline"
            >
              Ввести другой номер
            </button>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/admin/Maksud"
            className="text-[13px] text-ink-500 underline"
          >
            Назад к входу
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
