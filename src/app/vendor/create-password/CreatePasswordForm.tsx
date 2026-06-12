"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { maskPhoneInput } from "@/lib/utils";
import { createVendorCredentialsAction } from "@/server/vendor-credentials-actions";
import { CheckCircle2 } from "lucide-react";

export function CreatePasswordForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("phone", phone);
    fd.set("login", login);
    fd.set("password", password);
    fd.set("passwordConfirm", passwordConfirm);
    startTransition(async () => {
      const res = await createVendorCredentialsAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-ink-100 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="mt-4 text-[20px] font-extrabold text-ink-900">
          Учётные данные созданы!
        </h2>
        <p className="mt-2 text-[14px] text-ink-600">
          Теперь вы можете войти в кабинет продавца, используя логин{" "}
          <strong className="text-brand-700">{login}</strong> и ваш пароль.
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

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Input
        label="Номер телефона из заявки"
        placeholder="+7 (___) ___-__-__"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
      />
      <Input
        label="Логин"
        placeholder="Например: moy-magazin"
        autoComplete="username"
        value={login}
        onChange={(e) =>
          setLogin(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))
        }
        maxLength={32}
      />
      <p className="text-[11px] text-ink-400 -mt-1">
        Латинские буквы, цифры, точка, дефис, подчёркивание. Мин. 3 символа.
      </p>
      <Input
        label="Пароль"
        placeholder="Не менее 6 символов"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        label="Подтвердите пароль"
        placeholder="Повторите пароль"
        type="password"
        autoComplete="new-password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        error={error ?? undefined}
      />
      <Button fullWidth size="lg" type="submit" disabled={pending}>
        {pending ? "Создаём..." : "Создать учётные данные"}
      </Button>
      <p className="text-center text-[12px] text-ink-500">
        Уже есть логин и пароль?{" "}
        <Link
          href="/vendor/login"
          className="font-semibold text-brand-700 hover:underline"
        >
          Войти
        </Link>
      </p>
    </form>
  );
}
