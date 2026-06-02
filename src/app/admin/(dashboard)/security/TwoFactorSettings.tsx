"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  get2FAStatus,
  setup2FA,
  confirm2FA,
  disable2FA,
} from "@/server/admin-2fa-actions";

type Phase = "loading" | "off" | "setup" | "confirm" | "on";

export function TwoFactorSettings() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [secret, setSecret] = useState("");
  const [otpauth, setOtpauth] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get2FAStatus().then((s) => {
      setPhase(s.enabled ? "on" : "off");
    });
  }, []);

  async function startSetup() {
    setBusy(true);
    setError(null);
    try {
      const res = await setup2FA();
      if (!res.ok) {
        setError(res.error ?? "Ошибка");
        return;
      }
      setSecret(res.secret!);
      setOtpauth(res.otpauth!);
      setPhase("setup");
    } finally {
      setBusy(false);
    }
  }

  async function doConfirm() {
    if (code.length !== 6) {
      setError("Введите 6-значный код");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await confirm2FA(code);
      if (!res.ok) {
        setError(res.error ?? "Ошибка");
        return;
      }
      setPhase("on");
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function doDisable() {
    if (code.length !== 6) {
      setError("Введите 6-значный код для отключения");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await disable2FA(code);
      if (!res.ok) {
        setError(res.error ?? "Ошибка");
        return;
      }
      setPhase("off");
      setCode("");
      setSecret("");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "loading") {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center text-[13px] text-ink-500">
        Загрузка…
      </div>
    );
  }

  if (phase === "on") {
    return (
      <section className="rounded-2xl border border-ink-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-emerald-600" />
          <div>
            <h2 className="text-[15px] font-bold text-ink-900">
              2FA включена
            </h2>
            <p className="text-[12px] text-ink-500">
              При входе в админку запрашивается одноразовый код.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Input
            label="Код из приложения (для отключения)"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            placeholder="000000"
          />
          {error && (
            <div className="rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
              {error}
            </div>
          )}
          <Button onClick={doDisable} disabled={busy} fullWidth>
            <ShieldOff size={14} /> Отключить 2FA
          </Button>
        </div>
      </section>
    );
  }

  if (phase === "setup") {
    return (
      <section className="rounded-2xl border border-ink-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-brand-600" />
          <div>
            <h2 className="text-[15px] font-bold text-ink-900">
              Настройка 2FA
            </h2>
            <p className="text-[12px] text-ink-500">
              Шаг 1: Сканируйте QR-код или введите секрет вручную.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-ink-50 p-4 text-center space-y-2">
          <div className="text-[12px] text-ink-700 font-semibold">
            Используйте Google Authenticator, Authy или 1Password
          </div>
          <div className="text-[11px] text-ink-500 break-all font-mono bg-white rounded-lg p-2 border border-ink-200">
            {secret}
          </div>
          <div className="text-[10px] text-ink-400">
            otpauth: {otpauth}
          </div>
        </div>

        <div className="space-y-2">
          <Input
            label="Шаг 2: Введите код из приложения"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            placeholder="000000"
          />
          {error && (
            <div className="rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => { setPhase("off"); setCode(""); setError(null); }}
            >
              Отмена
            </Button>
            <Button fullWidth onClick={doConfirm} disabled={busy}>
              {busy ? "Проверяю..." : "Подтвердить"}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // phase === "off"
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-3">
        <ShieldOff size={24} className="text-ink-400" />
        <div>
          <h2 className="text-[15px] font-bold text-ink-900">
            2FA отключена
          </h2>
          <p className="text-[12px] text-ink-500">
            Рекомендуется включить двухфакторную аутентификацию для защиты
            админ-панели от несанкционированного доступа.
          </p>
        </div>
      </div>
      {error && (
        <div className="rounded-xl bg-red-50 p-2.5 text-[12px] text-red-700">
          {error}
        </div>
      )}
      <Button onClick={startSetup} disabled={busy} fullWidth>
        <Shield size={14} /> Включить 2FA
      </Button>
    </section>
  );
}
