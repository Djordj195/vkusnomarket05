import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  Truck,
  Heart,
  MessageSquare,
  ShieldCheck,
  User,
} from "lucide-react";
import { FAQ_CATEGORIES } from "@/data/faq";

export const metadata = {
  title: "Частые вопросы · ВкусМаркет",
  description: "Ответы на самые частые вопросы клиентов ВкусМаркет",
};

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  ordering: ShoppingBag,
  payment: CreditCard,
  delivery: Truck,
  loyalty: Heart,
  account: User,
  feedback: MessageSquare,
  safety: ShieldCheck,
};

export default function FaqPage() {
  return (
    <PageShell className="bg-white">
      <header className="sticky top-0 z-30 pt-safe-top bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-ink-100">
        <div className="mx-auto max-w-screen-lg px-2 py-3 flex items-center gap-1.5">
          <Link
            href="/support"
            aria-label="Назад"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="flex-1 truncate text-[16px] font-semibold text-ink-900">
            Частые вопросы
          </h1>
          <BrandPill />
        </div>
      </header>

      <section className="px-4 pt-4">
        <p className="text-[13px] text-ink-600">
          Выберите категорию, чтобы посмотреть ответы. Если ответа нет —
          напишите в поддержку.
        </p>
      </section>

      <section className="px-4 pt-4 pb-6">
        <h2 className="text-[15px] font-bold text-ink-900">Категории</h2>
        <ul className="mt-3 space-y-2">
          {FAQ_CATEGORIES.map((c) => {
            const Icon = ICONS[c.slug] ?? MessageSquare;
            return (
              <li key={c.slug}>
                <Link
                  href={`/faq/${c.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-ink-900">
                      {c.title}
                    </div>
                    <div className="truncate text-[12px] text-ink-500">
                      {c.questions.length}{" "}
                      {c.questions.length === 1
                        ? "вопрос"
                        : c.questions.length < 5
                        ? "вопроса"
                        : "вопросов"}{" "}
                      · {c.description}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-ink-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="px-4 pb-8">
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <h3 className="text-[14px] font-bold text-brand-900">
            Не нашли ответ?
          </h3>
          <p className="mt-1 text-[12px] text-brand-800/90">
            Напишите нам через раздел поддержки или оставьте обращение в форме
            «Отзывы и предложения».
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/support"
              className="rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-brand-700"
            >
              Поддержка
            </Link>
            <Link
              href="/feedback"
              className="rounded-xl bg-white px-3 py-2 text-[12px] font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
            >
              Оставить отзыв
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
