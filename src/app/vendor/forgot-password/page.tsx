import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { KeyRound } from "lucide-react";

export const metadata = {
  title: "Восстановление пароля · ВкусМаркет",
  description: "Сброс пароля для кабинета продавца через SMS-код.",
};

export default function VendorForgotPasswordPage() {
  return (
    <PageShell className="bg-white">
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="ВкусМаркет — на главную"
            className="block"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-ink-900 text-[10px] font-extrabold leading-none text-accent-300">
              ВМ
            </span>
          </Link>
          <BrandPill />
          <Link
            href="/vendor/login"
            className="text-[12px] font-semibold text-brand-600"
          >
            Войти
          </Link>
        </div>
      </div>

      <div className="px-4 pt-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <KeyRound size={26} />
        </div>
        <h1 className="mt-4 text-[24px] font-extrabold leading-tight text-ink-900">
          Восстановление пароля
        </h1>
        <p className="mt-2 text-[13px] text-ink-500">
          Введите номер телефона, который вы указали при регистрации.
          Мы отправим код для сброса пароля по SMS или звонком.
        </p>
      </div>

      <div className="px-4 pt-6 pb-4">
        <ForgotPasswordForm />
      </div>
    </PageShell>
  );
}
