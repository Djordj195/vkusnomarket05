import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import { AlertTriangle, ChevronLeft, Download, Info } from "lucide-react";
import { LEGAL_DOCS, getLegalDoc, type LegalBlock } from "@/data/legal";

type PageParams = Promise<{ doc: string }>;

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<{ title: string; description?: string }> {
  const { doc } = await params;
  const item = getLegalDoc(doc);
  if (!item) return { title: "Документ · ВкусМаркет" };
  return {
    title: `${item.shortTitle} · ВкусМаркет`,
    description: item.description,
  };
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "p") {
    return (
      <p className="mt-3 text-[14px] leading-[1.55] text-ink-800">
        {block.text}
      </p>
    );
  }
  if (block.type === "ul") {
    return (
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] leading-[1.55] text-ink-800">
        {block.items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    );
  }
  const tone = block.tone ?? "info";
  const cls =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-brand-200 bg-brand-50 text-brand-900";
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={`mt-3 flex items-start gap-2 rounded-xl border ${cls} px-3 py-2.5 text-[13px] leading-[1.5]`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <p>{block.text}</p>
    </div>
  );
}

export default async function LegalDocPage({
  params,
}: {
  params: PageParams;
}) {
  const { doc } = await params;
  const item = getLegalDoc(doc);
  if (!item) notFound();

  return (
    <PageShell className="bg-white">
      <header className="sticky top-0 z-30 pt-safe-top bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-ink-100">
        <div className="mx-auto max-w-screen-lg px-2 py-3 flex items-center gap-1.5">
          <Link
            href="/legal"
            aria-label="Назад"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="flex-1 truncate text-[16px] font-semibold text-ink-900">
            {item.shortTitle}
          </h1>
          <BrandPill />
        </div>
      </header>

      <article className="px-4 pt-5 pb-12">
        <h2 className="text-[18px] font-bold leading-tight text-ink-900">
          {item.number ? `${item.number}. ` : ""}
          {item.title}
        </h2>

        {(item.revision || item.effectiveDate) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
            {item.revision && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 font-semibold uppercase tracking-wide text-ink-600">
                {item.revision}
              </span>
            )}
            {item.effectiveDate && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-ink-600">
                Дата вступления в силу: {item.effectiveDate}
              </span>
            )}
          </div>
        )}

        {item.pdf && (
          <a
            href={item.pdf}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-3 py-2 text-[12px] font-semibold text-white hover:bg-ink-700"
          >
            <Download size={14} /> Скачать оригинал PDF
          </a>
        )}

        {item.intro?.length ? (
          <section className="mt-5 border-l-2 border-brand-200 pl-3">
            {item.intro.map((b, i) => (
              <Block key={i} block={b} />
            ))}
          </section>
        ) : null}

        {item.sections.map((s, i) => (
          <section key={i} className="mt-6">
            {s.heading && (
              <h3 className="text-[15px] font-bold text-ink-900">
                {s.heading}
              </h3>
            )}
            <div className={s.heading ? "mt-1" : ""}>
              {s.blocks.map((b, j) => (
                <Block key={j} block={b} />
              ))}
            </div>
          </section>
        ))}

        <div className="mt-10 rounded-2xl border border-ink-200 bg-ink-50 p-4">
          <h4 className="text-[13px] font-bold text-ink-900">
            Остались вопросы?
          </h4>
          <p className="mt-1 text-[12px] text-ink-600">
            Если что-то непонятно в документе — напишите нам, разберёмся.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/support"
              className="rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-brand-700"
            >
              Связаться с поддержкой
            </Link>
            <Link
              href="/legal"
              className="rounded-xl bg-white px-3 py-2 text-[12px] font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
            >
              К списку документов
            </Link>
          </div>
        </div>
      </article>
    </PageShell>
  );
}
