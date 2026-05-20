import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import { ChevronLeft, FileText } from "lucide-react";
import { LEGAL_ITEMS } from "@/app/legal/page";

type PageParams = Promise<{ doc: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<{ title: string }> {
  const { doc } = await params;
  const item = LEGAL_ITEMS.find((i) => i.slug === doc);
  return { title: `${item?.title ?? "Документ"} · ВкусМаркет` };
}

export default async function LegalDocPage({
  params,
}: {
  params: PageParams;
}) {
  const { doc } = await params;
  const item = LEGAL_ITEMS.find((i) => i.slug === doc);
  if (!item) notFound();

  return (
    <PageShell className="bg-white">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-ink-100">
        <div className="mx-auto max-w-md px-2 py-3 flex items-center gap-1.5">
          <Link
            href="/legal"
            aria-label="Назад"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="flex-1 truncate text-[16px] font-semibold text-ink-900">
            {item.title}
          </h1>
          <BrandPill />
        </div>
      </header>

      <section className="px-4 pt-6 pb-8">
        <p className="text-[13px] text-ink-600">{item.description}</p>
        <div className="mt-4 rounded-2xl border border-dashed border-ink-300 bg-white p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">
            <FileText size={22} />
          </div>
          <h2 className="mt-3 text-[15px] font-bold text-ink-900">
            Данные в обработке
          </h2>
          <p className="mt-1 text-[12px] text-ink-500">
            Документ готовится юристами. После публикации он появится здесь и
            будет доступен для скачивания. Текущая версия и история изменений
            будут зафиксированы.
          </p>
          <div className="mt-4 flex justify-center gap-2">
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
              К списку
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
