import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import { getCurrentVendor } from "@/server/vendor-auth";
import { LoginForm } from "./LoginForm";
import { Store } from "lucide-react";

export const metadata = {
  title: "Вход для продавцов · ВкусМаркет",
  description: "Кабинет продавца — управление витриной, каталогом и заказами.",
};

export default async function VendorLoginPage() {
  const current = await getCurrentVendor();
  if (current) {
    redirect("/vendor/dashboard");
  }

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
            href="/vendor/signup"
            className="text-[12px] font-semibold text-brand-600"
          >
            Регистрация
          </Link>
        </div>
      </div>

      <div className="px-4 pt-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Store size={26} />
        </div>
        <h1 className="mt-4 text-[24px] font-extrabold leading-tight text-ink-900">
          Вход для продавцов
        </h1>
        <p className="mt-2 text-[13px] text-ink-500">
          Введите номер телефона, указанный в заявке. Мы отправим SMS с
          6-значным кодом.
        </p>
      </div>

      <div className="px-4 pt-6 pb-4">
        <LoginForm />
      </div>

      <div className="px-4 pb-6">
        <div className="rounded-2xl bg-ink-50 p-4 text-[12px] text-ink-600">
          Если вашего магазина ещё нет в системе — оставьте заявку на{" "}
          <Link
            href="/vendor/signup"
            className="font-semibold text-brand-700 hover:underline"
          >
            странице регистрации
          </Link>
          . После одобрения вы получите доступ в личный кабинет.
        </div>
      </div>
    </PageShell>
  );
}
