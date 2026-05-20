import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import { ChevronLeft, FileText } from "lucide-react";

const TITLES: Record<string, string> = {
  ordering: "Заказы и оформление",
  payment: "Оплата",
  delivery: "Доставка",
  loyalty: "Бонусы и промокоды",
  account: "Аккаунт",
  feedback: "Отзывы и поддержка",
  safety: "Безопасность и приватность",
};

type PageParams = Promise<{ category: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<{ title: string }> {
  const { category } = await params;
  const title = TITLES[category] ?? "Частые вопросы";
  return { title: `${title} · ВкусМаркет` };
}

export default async function FaqCategoryPage({
  params,
}: {
  params: PageParams;
}) {
  const { category } = await params;
  const title = TITLES[category];
  if (!title) notFound();

  return (
    <PageShell className="bg-white">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-ink-100">
        <div className="mx-auto max-w-md px-2 py-3 flex items-center gap-1.5">
          <Link
            href="/faq"
            aria-label="Назад"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="flex-1 truncate text-[16px] font-semibold text-ink-900">
            {title}
          </h1>
          <BrandPill />
        </div>
      </header>

      <div className="px-4 pt-6 pb-8">
        <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">
            <FileText size={22} />
          </div>
          <h2 className="mt-3 text-[15px] font-bold text-ink-900">
            Данные в обработке
          </h2>
          <p className="mt-1 text-[12px] text-ink-500">
            Статьи в этом разделе появятся в ближайшее время. Пока что вы можете
            написать нам в поддержку.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href="/support"
              className="rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-brand-700"
            >
              Написать в поддержку
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
