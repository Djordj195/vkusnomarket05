"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type DeliveryMethod = "sms" | "call" | "demo";

type OtpStatus =
  | "sent"       // код отправляется
  | "waiting"    // ждём ввода кода
  | "delayed"    // SMS задерживается (>30 сек)
  | "verifying"  // проверяем код
  | "error";     // ошибка

type Props = {
  phone: string;
  demoCode: string | null;
  cooldownSec: number;
  method?: DeliveryMethod;
  error: string | null;
  loading: boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangePhone: () => void;
  extraInfo?: React.ReactNode;
};

export function OtpCodeStep({
  phone,
  demoCode,
  cooldownSec,
  method,
  error,
  loading,
  onVerify,
  onResend,
  onChangePhone,
  extraInfo,
}: Props) {
  const [code, setCode] = useState("");
  const [tick, setTick] = useState(0);
  const [prevCooldown, setPrevCooldown] = useState(cooldownSec);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Adjust state during render when prop changes (React 19 approved pattern)
  if (prevCooldown !== cooldownSec) {
    setPrevCooldown(cooldownSec);
    setTick(0);
  }

  // Countdown and elapsed derived from tick
  const countdown = Math.max(0, cooldownSec - tick);
  const elapsedSec = tick;

  // Derived status
  const status: OtpStatus = useMemo(() => {
    if (error) return "error";
    if (loading) return "verifying";
    if (elapsedSec < 3) return "sent";
    if (elapsedSec < 30) return "waiting";
    return "delayed";
  }, [error, loading, elapsedSec]);

  // Tick timer — subscribes to external clock
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleResend = useCallback(() => {
    setCode("");
    onResend();
  }, [onResend]);

  const handleVerify = useCallback(() => {
    if (code.length >= 4) onVerify(code);
  }, [code, onVerify]);

  const isCall = method === "call";

  const statusBanner = (() => {
    switch (status) {
      case "sent":
        return (
          <div className="rounded-xl bg-brand-50 p-3 text-[13px] text-brand-800">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <span>
                {isCall
                  ? <>Звоним на <strong>{phone}</strong>...</>
                  : <>Отправляем код на <strong>{phone}</strong>...</>
                }
              </span>
            </div>
          </div>
        );
      case "waiting":
        return (
          <div className="rounded-xl bg-brand-50 p-3 text-[13px] text-brand-800">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              <span>
                {isCall
                  ? <>Вам звонит робот на <strong>{phone}</strong></>
                  : <>Код отправлен на <strong>{phone}</strong></>
                }
              </span>
            </div>
            <p className="mt-1 text-[12px] text-brand-700/80">
              {isCall
                ? "Ответьте на звонок — робот продиктует 4-значный код."
                : "Проверьте SMS. Введите код из сообщения."
              }
            </p>
          </div>
        );
      case "delayed":
        return (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[13px] text-amber-900">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              <span>
                {isCall
                  ? "Звонок задерживается"
                  : "SMS задерживается"
                }
              </span>
            </div>
            <p className="mt-1 text-[12px] text-amber-800/80">
              {isCall
                ? "Если звонок не поступил — отправьте код повторно."
                : "Если SMS не пришла — отправьте код повторно."
              }
            </p>
          </div>
        );
      case "verifying":
        return (
          <div className="rounded-xl bg-brand-50 p-3 text-[13px] text-brand-800">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <span>Проверяем код...</span>
            </div>
          </div>
        );
      case "error":
        return null;
    }
  })();

  return (
    <div className="space-y-3">
      {statusBanner}

      {extraInfo}

      {demoCode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
          Демо-режим: SMS-провайдер не подключён, используйте код{" "}
          <strong>{demoCode}</strong>.
        </div>
      )}

      <Input
        label={isCall ? "Код из звонка" : "Код подтверждения"}
        placeholder={isCall ? "••••" : "••••••"}
        inputMode="numeric"
        value={code}
        onChange={(e) =>
          setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        maxLength={6}
        error={error ?? undefined}
        autoFocus
      />

      <Button
        fullWidth
        size="lg"
        onClick={handleVerify}
        disabled={loading || code.length < 4}
      >
        {loading ? "Проверяем..." : "Подтвердить"}
      </Button>

      {/* Resend section with countdown */}
      <div className="text-center space-y-1">
        {countdown > 0 ? (
          <p className="text-[13px] text-ink-500">
            Отправить повторно через{" "}
            <span className="font-semibold tabular-nums text-ink-700">
              {countdown}
            </span>{" "}
            сек
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-[13px] font-semibold text-brand-700 hover:underline disabled:text-ink-400"
          >
            Отправить код повторно
          </button>
        )}
        <button
          type="button"
          onClick={onChangePhone}
          className="block w-full text-center text-[13px] text-ink-500 hover:text-ink-800"
        >
          Изменить номер
        </button>
      </div>
    </div>
  );
}
