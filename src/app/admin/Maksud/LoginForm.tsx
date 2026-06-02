"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginAction, type LoginState } from "@/server/admin-actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <Input
        name="login"
        label="Логин"
        placeholder="admin"
        required
        defaultValue="admin"
        autoComplete="username"
      />
      <Input
        name="password"
        label="Пароль"
        type="password"
        required
        autoComplete="current-password"
        error={state.error}
      />
      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Входим..." : "Войти"}
      </Button>
      <div className="text-center">
        <Link
          href="/admin/Maksud/recovery"
          className="text-[13px] text-ink-500 hover:text-brand-600 underline"
        >
          Забыли пароль?
        </Link>
      </div>
    </form>
  );
}
