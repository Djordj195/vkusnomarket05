import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import { ChevronLeft } from "lucide-react";
import { FAQ_CATEGORIES, getFaqCategory } from "@/data/faq";
import { FaqAccordion } from "./FaqAccordion";

type PageParams = Promise<{ category: string }>;

export function generateStaticParams() {
  return FAQ_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<{ title: string; description?: string }> {
  const { category } = await params;
  const cat = getFaqCategory(category);
  if (!cat) return { title: "Частые вопросы · ВкусМаркет" };
  return {
    title: `${cat.title} · Частые вопросы · ВкусМаркет`,
    description: cat.description,
  };
}

export default async function FaqCategoryPage({
  params,
}: {
  params: PageParams;
}) {
  const { category } = await params;
  const cat = getFaqCategory(category);
  if (!cat) notFound();

  return (
    <PageShell className="bg-white">
      <header className="sticky top-0 z-30 pt-safe-top bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-ink-100">
        <div className="mx-auto max-w-screen-lg px-2 py-3 flex items-center gap-1.5">
          <Link
            href="/market/faq"
            aria-label="Назад"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="flex-1 truncate text-[16px] font-semibold text-ink-900">
            {cat.title}
          </h1>
          <BrandPill />
        </div>
      </header>

      <article className="px-4 pt-5 pb-12">
        <p className="text-[13px] text-ink-600">{cat.description}</p>

        <FaqAccordion questions={cat.questions} />

        <div className="mt-8 rounded-2xl border border-ink-200 bg-ink-50 p-4">
          <h4 className="text-[13px] font-bold text-ink-900">
            Не нашли ответ?
          </h4>
          <p className="mt-1 text-[12px] text-ink-600">
            Напишите нам — поддержка отвечает в порядке очереди в рабочее
            время.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/market/support"
              className="rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-brand-700"
            >
              Написать в поддержку
            </Link>
            <Link
              href="/market/faq"
              className="rounded-xl bg-white px-3 py-2 text-[12px] font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
            >
              К списку категорий
            </Link>
          </div>
        </div>
      </article>
    </PageShell>
  );
}
