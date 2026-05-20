"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { maskPhoneInput } from "@/lib/utils";
import {
  sendVendorCodeAction,
  verifyVendorCodeAction,
} from "@/server/vendor-login-actions";

type Step = "phone" | "code";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("phone", phone);
    startTransition(async () => {
      const res = await sendVendorCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setBrandName(res.brandName);
      setStep("code");
    });
  }

  function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("phone", phone);
    fd.set("code", code);
    startTransition(async () => {
      const res = await verifyVendorCodeAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/vendor/dashboard");
      router.refresh();
    });
  }

  if (step === "phone") {
    return (
      <form className="space-y-3" onSubmit={onSendCode}>
        <Input
          label="Номер телефона"
          placeholder="+7 (___) ___-__-__"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
          error={error ?? undefined}
        />
        <Button fullWidth size="lg" type="submit" disabled={pending}>
          {pending ? "Отправляем..." : "Получить код"}
        </Button>
        <p className="text-center text-[11px] text-ink-500">
          Нажимая «Получить код», вы соглашаетесь с{" "}
          <Link
            href="/legal/offer"
            className="font-semibold text-brand-700 hover:underline"
          >
            офертой
          </Link>{" "}
          и{" "}
          <Link
            href="/legal/privacy"
            className="font-semibold text-brand-700 hover:underline"
          >
            политикой
          </Link>
          .
        </p>
      </form>
    );
  }

  return (
    <form className="space-y-3" onSubmit={onVerify}>
      <div className="rounded-xl bg-brand-50 p-3 text-[13px] text-brand-800">
        Код отправлен на номер <strong>{phone}</strong>
        {brandName && (
          <div className="mt-1 text-[12px] text-brand-700/80">
            Магазин: {brandName}
          </div>
        )}
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
        {pending ? "Проверяем..." : "Войти в кабинет"}
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
      <p className="text-center text-[11px] text-ink-400">
        Не пришёл код? Проверьте номер или подождите 60 секунд.
      </p>
    </form>
  );
}
