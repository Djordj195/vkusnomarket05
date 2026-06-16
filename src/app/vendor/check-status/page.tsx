import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { CheckStatusForm } from "./CheckStatusForm";

export const metadata: Metadata = {
  title: "Статус заявки · ВкусМаркет",
  description: "Проверьте статус вашей заявки продавца на ВкусМаркет.",
};

export default function VendorCheckStatusPage() {
  return (
    <PageShell>
      <Header variant="page" title="Статус заявки" showBack />
      <div className="px-4 pt-4 pb-8 space-y-5">
        <div className="rounded-2xl bg-brand-50 p-4">
          <h1 className="text-[20px] font-extrabold leading-tight text-ink-900">
            Проверить статус заявки
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
            Введите номер телефона, который вы указали при подаче заявки. После
            одобрения вы сможете создать логин и пароль для входа.
          </p>
        </div>
        <CheckStatusForm />
      </div>
    </PageShell>
  );
}
