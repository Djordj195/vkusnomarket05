"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { maskPhoneInput } from "@/lib/utils";
import {
  sendVendorRecoveryCodeAction,
  resetVendorPasswordAction,
} from "@/server/vendor-recovery-actions";
import { CheckCircle2 } from "lucide-react";

type Step = "phone" | "code" | "success";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function sendCode() {
    setError(null);
    const fd = new FormData();
    fd.set("phone", phone);
    startTransition(async () => {
      const res = await sendVendorRecoveryCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMaskedPhone(res.maskedPhone);
      setDemoCode(res.demoCode);
      setStep("code");
    });
  }

  function resetPassword() {
    setError(null);
    if (!code.trim()) {
      setError("Введите код из SMS.");
      return;
    }
    if (!newPassword) {
      setError("Введите новый пароль.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Пароль должен быть не менее 6 символов.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }
    const fd = new FormData();
    fd.set("phone", phone);
    fd.set("code", code);
    fd.set("newPassword", newPassword);
    fd.set("confirmPassword", confirmPassword);
    startTransition(async () => {
      const res = await resetVendorPasswordAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStep("success");
    });
  }

  if (step === "success") {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-ink-100 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="mt-4 text-[20px] font-extrabold text-ink-900">
          Пароль изменён!
        </h2>
        <p className="mt-2 text-[14px] text-ink-600">
          Теперь вы можете войти в кабинет продавца с новым паролем.
        </p>
        <Button
          fullWidth
          size="lg"
          className="mt-6"
          onClick={() => router.push("/vendor/login")}
        >
          Войти в кабинет
        </Button>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-brand-50 p-3 text-[13px] text-brand-800">
          Код отправлен на номер <strong>{maskedPhone}</strong>
        </div>
        {demoCode && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
            Демо-режим: используйте код <strong>{demoCode}</strong>
          </div>
        )}
        <Input
          label="Код из SMS"
          placeholder="••••••"
          inputMode="numeric"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          maxLength={6}
          autoComplete="one-time-code"
        />
        <Input
          label="Новый пароль"
          placeholder="Не менее 6 символов"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          label="Подтвердите пароль"
          placeholder="Повторите пароль"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={error ?? undefined}
        />
        <Button fullWidth size="lg" onClick={resetPassword} disabled={pending}>
          {pending ? "Сохраняем..." : "Сохранить новый пароль"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
            setNewPassword("");
            setConfirmPassword("");
            setError(null);
          }}
          className="block w-full text-center text-[13px] text-ink-500 hover:text-ink-800"
        >
          Изменить номер
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        label="Номер телефона из заявки"
        placeholder="+7 (___) ___-__-__"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
        error={error ?? undefined}
      />
      <Button fullWidth size="lg" onClick={sendCode} disabled={pending}>
        {pending ? "Отправляем..." : "Получить код"}
      </Button>
      <p className="text-center text-[12px] text-ink-500">
        Вспомнили пароль?{" "}
        <Link
          href="/vendor/login"
          className="font-semibold text-brand-700 hover:underline"
        >
          Войти
        </Link>
      </p>
    </div>
  );
}
