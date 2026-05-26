import Link from "next/link";
import { FileText, History, Download } from "lucide-react";
import { LEGAL_DOCS } from "@/data/legal";

export default function AdminLegalDocsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Юр.документы
        </h1>
        <p className="text-[12px] text-ink-500">
          Опубликовано {LEGAL_DOCS.length} документов. Согласия пользователей
          сохраняются вместе с версией документа, IP-адресом и устройством.
        </p>
      </header>

      <ul className="space-y-2">
        {LEGAL_DOCS.map((d) => (
          <li
            key={d.slug}
            className="flex items-start justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-3"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                <FileText size={18} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-ink-900">
                  {d.number ? `${d.number}. ` : ""}
                  {d.shortTitle}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
                  {d.effectiveDate && (
                    <span>от {d.effectiveDate}</span>
                  )}
                  <Link
                    href={`/legal/${d.slug}`}
                    className="text-brand-600 hover:underline"
                  >
                    Открыть публично →
                  </Link>
                  {d.pdf && (
                    <a
                      href={d.pdf}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-0.5 text-ink-600 hover:underline"
                    >
                      <Download size={11} /> PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              {d.revision ?? "v1"}
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
