import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import { Bike } from "lucide-react";
import { getCurrentCourier } from "@/server/courier-auth";
import { CourierLoginForm } from "./CourierLoginForm";

export const metadata = {
  title: "Вход для курьеров · ВкусМаркет",
  description: "Курьерское приложение: заказы, маршруты, статусы доставки.",
};

export default async function CourierLoginPage() {
  const current = await getCurrentCourier();
  if (current) {
    redirect("/courier/dashboard");
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
          <span className="text-[11px] font-semibold text-ink-400">
            Курьер
          </span>
        </div>
      </div>

      <div className="px-4 pt-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Bike size={26} />
        </div>
        <h1 className="mt-4 text-[24px] font-extrabold leading-tight text-ink-900">
          Курьерское приложение
        </h1>
        <p className="mt-2 text-[13px] text-ink-500">
          Войдите по номеру телефона — мы пришлём SMS с 6-значным кодом.
        </p>
      </div>

      <div className="px-4 pt-6 pb-6">
        <CourierLoginForm />
      </div>

      <div className="px-4 pb-6">
        <div className="rounded-2xl bg-ink-50 p-4 text-[12px] text-ink-600">
          Есть два типа курьеров. <strong>Курьер платформы</strong> берёт
          заказы от разных продавцов в своей зоне.{" "}
          <strong>Курьер магазина</strong> привязан к одному продавцу. Курьер
          магазина может также подключиться как курьер платформы, чтобы брать
          дополнительные заказы.
        </div>
      </div>
    </PageShell>
  );
}
