"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OtpCodeStep } from "@/components/auth/OtpCodeStep";
import { maskPhoneInput } from "@/lib/utils";
import {
  sendVendorOtpAction,
  verifyVendorOtpAction,
} from "@/server/vendor-otp-login-actions";

type Step = "phone" | "code";

export function VendorOtpLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(60);
  const [method, setMethod] = useState<"sms" | "call" | "demo">("sms");

  const onSendCode = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      const res = await sendVendorOtpAction(fd);
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
  }, [phone]);

  const onVerify = useCallback(async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      fd.set("code", code);
      const res = await verifyVendorOtpAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/vendor/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }, [phone, router]);

  const handleResend = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      const res = await sendVendorOtpAction(fd);
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

  if (step === "phone") {
    return (
      <form className="space-y-3" onSubmit={onSendCode}>
        <Input
          label="Номер телефона из заявки"
          placeholder="+7 (___) ___-__-__"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
          error={error ?? undefined}
        />
        <Button fullWidth size="lg" type="submit" disabled={loading}>
          {loading ? "Отправляем код..." : "Получить код"}
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
    <OtpCodeStep
      phone={phone}
      demoCode={demoCode}
      cooldownSec={cooldownSec}
      method={method}
      error={error}
      loading={loading}
      onVerify={onVerify}
      onResend={handleResend}
      onChangePhone={() => {
        setStep("phone");
        setError(null);
      }}
    />
  );
}
