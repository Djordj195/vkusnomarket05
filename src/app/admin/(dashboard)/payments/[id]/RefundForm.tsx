"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { refundPaymentAction } from "@/server/payments/payments-actions";

export function RefundForm({
  paymentId,
  maxKop,
}: {
  paymentId: string;
  maxKop: number;
}) {
  const [amountRub, setAmountRub] = useState(Math.round(maxKop / 100).toString());
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    setSuccess(false);
    const kop = Math.round(Number(amountRub) * 100);
    if (!Number.isFinite(kop) || kop <= 0) {
      setError("Введите корректную сумму.");
      return;
    }
    if (kop > maxKop) {
      setError("Сумма больше остатка к возврату.");
      return;
    }
    startTransition(async () => {
      const res = await refundPaymentAction({
        paymentId,
        amountKop: kop,
        reason: reason.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error ?? "Не удалось оформить возврат.");
        return;
      }
      setSuccess(true);
    });
  };

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-4">
      <h2 className="text-[14px] font-bold text-ink-900">Возврат</h2>
      <p className="mt-0.5 text-[11px] text-ink-500">
        Возврат отправляется в ЮKassa. Чек коррекции формируется автоматически.
      </p>
      <div className="mt-3 space-y-2">
        <Input
          label="Сумма ₽"
          value={amountRub}
          onChange={(e) => setAmountRub(e.target.value)}
          inputMode="decimal"
        />
        <Textarea
          label="Причина (опционально)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
        />
        {error && (
          <p className="text-[12px] text-rose-600">{error}</p>
        )}
        {success && (
          <p className="text-[12px] text-emerald-600">Возврат оформлен.</p>
        )}
        <Button
          variant="primary"
          onClick={submit}
          disabled={pending}
          className="w-full"
        >
          {pending ? "Отправляю…" : "Оформить возврат"}
        </Button>
      </div>
    </section>
  );
}
