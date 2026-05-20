import Link from "next/link";
import { FileText, History } from "lucide-react";

const DOCS = [
  { id: "about", title: "О компании", slug: "/legal/about" },
  { id: "details", title: "Реквизиты", slug: "/legal/details" },
  { id: "offer", title: "Пользовательская оферта", slug: "/legal/offer" },
  { id: "privacy", title: "Политика конфиденциальности", slug: "/legal/privacy" },
  { id: "consent", title: "Согласие на обработку ПДн", slug: "/legal/consent" },
  { id: "delivery", title: "Правила доставки и возврата", slug: "/legal/delivery" },
  { id: "pharmacy", title: "Информация по аптечному разделу", slug: "/legal/pharmacy" },
  { id: "contacts", title: "Контакты поддержки", slug: "/legal/contacts" },
];

export default function AdminLegalDocsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Юр.документы
        </h1>
        <p className="text-[12px] text-ink-500">
          Версии и редакции документов. Согласия пользователей сохраняются
          вместе с версией документа, IP и устройством.
        </p>
      </header>

      <ul className="space-y-2">
        {DOCS.map((d) => (
          <li
            key={d.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-3"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                <FileText size={18} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-ink-900">
                  {d.title}
                </div>
                <Link
                  href={d.slug}
                  className="text-[11px] text-brand-600 hover:underline"
                >
                  Просмотр публичной версии →
                </Link>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
              v0
            </span>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <History size={16} className="text-ink-500" />
          <h2 className="text-[14px] font-bold text-ink-900">
            Версионирование — в разработке
          </h2>
        </div>
        <p className="mt-2 text-[12px] text-ink-600">
          Скоро вы сможете редактировать тексты, публиковать новые версии и
          видеть, сколько пользователей согласились с каждой редакцией. По
          закону «О персональных данных» (152-ФЗ) согласия фиксируются с
          версией документа, IP-адресом, устройством и снимком текста чекбокса.
        </p>
      </section>
    </div>
  );
}
