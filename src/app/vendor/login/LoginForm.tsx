"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { vendorLoginAction } from "@/server/vendor-login-actions";

export function LoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("login", login);
    fd.set("password", password);
    startTransition(async () => {
      const res = await vendorLoginAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/vendor/dashboard");
      router.refresh();
    });
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Input
        label="Логин"
        placeholder="Ваш логин"
        autoComplete="username"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        error={error && !password ? error : undefined}
      />
      <Input
        label="Пароль"
        placeholder="Ваш пароль"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error ?? undefined}
      />
      <Button fullWidth size="lg" type="submit" disabled={pending}>
        {pending ? "Входим..." : "Войти в кабинет"}
      </Button>
      <p className="text-center text-[12px] text-ink-500">
        Нет учётных данных?{" "}
        <Link
          href="/vendor/create-password"
          className="font-semibold text-brand-700 hover:underline"
        >
          Создать логин и пароль
        </Link>
      </p>
      <p className="text-center text-[11px] text-ink-500">
        Нажимая «Войти», вы соглашаетесь с{" "}
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
