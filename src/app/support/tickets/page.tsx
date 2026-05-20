import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Header } from "@/components/layout/Header";
import { FileText, MessageSquare, Plus } from "lucide-react";

export const metadata = {
  title: "Мои обращения · ВкусМаркет",
};

export default function MyTicketsPage() {
  return (
    <PageShell className="bg-white">
      <Header variant="page" title="Мои обращения" showBack />

      <div className="px-4 pt-3 pb-6 space-y-4">
        <section className="rounded-2xl bg-ink-50 p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink-500">
            <FileText size={22} />
          </div>
          <h2 className="mt-3 text-[16px] font-extrabold text-ink-900">
            У вас пока нет обращений
          </h2>
          <p className="mt-1 text-[12px] text-ink-500">
            Здесь будут появляться ваши тикеты после того, как вы свяжетесь с
            поддержкой или оставите жалобу.
          </p>
        </section>

        <Link
          href="/feedback"
          className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Plus size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-ink-900">
              Создать обращение
            </div>
            <div className="text-[11px] text-ink-500">
              Отзыв, предложение, жалоба или сообщение об ошибке
            </div>
          </div>
        </Link>

        <Link
          href="/support"
          className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
            <MessageSquare size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-ink-900">
              Связаться с поддержкой
            </div>
            <div className="text-[11px] text-ink-500">
              WhatsApp · Telegram · Телефон · Email
            </div>
          </div>
        </Link>
      </div>
    </PageShell>
  );
}
