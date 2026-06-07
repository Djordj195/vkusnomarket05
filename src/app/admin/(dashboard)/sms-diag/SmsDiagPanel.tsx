"use client";

import { useEffect, useState, useTransition } from "react";
import { getSmsDiagAction, testSmsSendAction } from "@/server/sms-diag-action";
import type { SmsDiagResult, SmsTestResult } from "@/server/sms-diag-action";

export default function SmsDiagPanel() {
  const [diag, setDiag] = useState<SmsDiagResult | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState<SmsTestResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getSmsDiagAction().then((d) => {
      if (!cancelled) setDiag(d);
    });
    return () => { cancelled = true; };
  }, []);

  const runTest = () => {
    setTestResult(null);
    startTransition(async () => {
      const r = await testSmsSendAction(testPhone.replace(/\D/g, ""));
      setTestResult(r);
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4 space-y-2">
        <h3 className="font-bold text-[16px]">Конфигурация SMS</h3>
        {!diag ? (
          <p className="text-ink-400 text-[14px]">Загрузка...</p>
        ) : (
          <div className="text-[13px] space-y-1">
            <Row label="Текущий провайдер" value={diag.provider} ok={diag.isReal} />
            <Row label="SMS_PROVIDER env" value={diag.envSmsProvider} />
            <Row label="SMSRU_API_ID задан" value={diag.envSmsruApiIdSet ? "Да" : "Нет"} ok={diag.envSmsruApiIdSet} />
            <Row label="SMSC_LOGIN задан" value={diag.envSmscLoginSet ? "Да" : "Нет"} ok={diag.envSmscLoginSet} />
            <Row label="SMS.ru сконфигурирован" value={diag.smsruConfigured ? "Да" : "Нет"} ok={diag.smsruConfigured} />
            <Row label="SMSC сконфигурирован" value={diag.smscConfigured ? "Да" : "Нет"} ok={diag.smscConfigured} />
            {!diag.isReal && (
              <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 text-[12px]">
                ⚠️ SMS работает в демо-режиме! Реальные SMS не отправляются.
                Убедитесь, что <code>SMSRU_API_ID</code> задан в переменных окружения Vercel
                и проект переразвёрнут.
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <h3 className="font-bold text-[16px]">Тест отправки SMS</h3>
        <p className="text-[12px] text-ink-500">
          Введите номер и нажмите «Отправить тест». На номер придёт тестовое сообщение.
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2 text-[14px]"
            placeholder="+7 (900) 123-45-67"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
          <button
            className="rounded-lg bg-brand-600 px-4 py-2 text-white text-[13px] font-semibold disabled:opacity-50"
            onClick={runTest}
            disabled={pending || testPhone.replace(/\D/g, "").length < 10}
          >
            {pending ? "..." : "Отправить тест"}
          </button>
        </div>
        {testResult && (
          <div
            className={`rounded-lg border p-3 text-[12px] ${
              testResult.ok
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <p>
              <strong>{testResult.ok ? "Успех!" : "Ошибка:"}</strong>{" "}
              {testResult.ok
                ? `SMS отправлено через ${testResult.providerName} (ID: ${testResult.providerMessageId ?? "-"})`
                : testResult.error}
            </p>
            <p className="mt-1 text-ink-500">Провайдер: {testResult.providerName}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string | boolean; ok?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={ok === true ? "text-emerald-700 font-semibold" : ok === false ? "text-red-600 font-semibold" : "text-ink-800"}>
        {String(value)}
      </span>
    </div>
  );
}
