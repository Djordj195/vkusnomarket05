import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { listCities } from "@/server/cities-store";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Стать продавцом · ВКУСНОМАРКЕТ",
  description:
    "Подключите свой бизнес к платформе ВКУСНОМАРКЕТ — кафе, магазин, аптека или хозтовары.",
};

export default async function VendorSignupPage() {
  const cities = await listCities();
  const orderedCities = [
    ...cities.filter((c) => c.status === "active"),
    ...cities.filter((c) => c.status !== "active"),
  ];

  return (
    <PageShell>
      <Header variant="page" title="Стать продавцом" showBack />
      <div className="px-4 pt-4 pb-8 space-y-5">
        <div className="rounded-2xl bg-brand-50 p-4">
          <h1 className="text-[20px] font-extrabold leading-tight text-ink-900">
            Подключите бизнес к ВКУСНОМАРКЕТ
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
            Заявка займёт 5 минут. После модерации мы пришлём ссылку для
            настройки витрины и загрузки товаров. Комиссия — от 6% по вашей
            вертикали, выплаты раз в неделю.
          </p>
        </div>

        <SignupForm cities={orderedCities} />

        <div className="rounded-2xl border border-ink-200 p-4 text-[12px] text-ink-500">
          Отправляя заявку, вы соглашаетесь с обработкой персональных данных и
          публичной офертой ВКУСНОМАРКЕТ.
        </div>
      </div>
    </PageShell>
  );
}
