"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { maskPhoneInput } from "@/lib/utils";
import {
  checkApplicationStatusAction,
  type CheckStatusResult,
} from "@/server/vendor-actions";
import type { VendorStatus } from "@/lib/types";

const STATUS_UI: Record<
  VendorStatus,
  { icon: typeof Clock; color: string; bg: string; label: string; message: string }
> = {
  draft: {
    icon: Clock,
    color: "text-ink-600",
    bg: "bg-ink-100",
    label: "Черновик",
    message: "Ваша заявка ещё не отправлена на модерацию.",
  },
  pending: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-100",
    label: "На модерации",
    message: "Заявка на рассмотрении. Обычно это занимает 1–3 рабочих дня. Мы отправим SMS когда заявка будет рассмотрена.",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    label: "Одобрена!",
    message: "Ваша заявка одобрена! Теперь вы можете создать логин и пароль для входа в кабинет продавца.",
  },
  suspended: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-100",
    label: "Приостановлена",
    message: "Ваша заявка приостановлена. Свяжитесь с поддержкой для уточнения.",
  },
  blocked: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Отклонена",
    message: "К сожалению, ваша заявка отклонена. Свяжитесь с поддержкой для уточнения причин.",
  },
};

export function CheckStatusForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<CheckStatusResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await checkApplicationStatusAction(phone);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
    });
  }

  if (result) {
    const ui = STATUS_UI[result.status];
    const Icon = ui.icon;
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-ink-100 text-center">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${ui.bg} ${ui.color}`}>
          <Icon size={28} />
        </div>
        <h2 className="mt-4 text-[20px] font-extrabold text-ink-900">
          {result.brandName}
        </h2>
        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[12px] font-bold ${ui.bg} ${ui.color}`}>
          {ui.label}
        </span>
        <p className="mt-3 text-[14px] text-ink-600">{ui.message}</p>

        {result.status === "approved" && (
          <Button
            fullWidth
            size="lg"
            className="mt-6"
            onClick={() => router.push("/vendor/create-password")}
          >
            Создать логин и пароль <ArrowRight size={16} className="ml-1" />
          </Button>
        )}

        {result.status === "pending" && (
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            className="mt-6"
            onClick={() => {
              setResult(null);
              setPhone("");
            }}
          >
            Проверить ещё раз
          </Button>
        )}

        <button
          type="button"
          onClick={() => {
            setResult(null);
            setPhone("");
          }}
          className="mt-3 block w-full text-center text-[13px] text-ink-500 hover:text-ink-800"
        >
          Проверить другой номер
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-ink-100 space-y-4">
        <Input
          label="Номер телефона из заявки"
          placeholder="+7 (___) ___-__-__"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
          error={error ?? undefined}
        />
        <Button fullWidth size="lg" type="submit" disabled={pending}>
          {pending ? "Проверяем..." : "Проверить статус"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 text-center text-[13px]">
        <Link href="/vendor/create-password" className="font-semibold text-brand-700 hover:underline">
          Уже одобрены? Создать логин и пароль
        </Link>
        <Link href="/vendor/login" className="text-ink-500 hover:text-ink-800">
          Уже есть аккаунт? Войти
        </Link>
      </div>
    </form>
  );
}
