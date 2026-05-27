import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Receipt,
  ShieldCheck,
  ScrollText,
  Truck,
  Pill,
  Phone,
  Megaphone,
} from "lucide-react";
import { LEGAL_DOCS } from "@/data/legal";

export const metadata = {
  title: "Юридическая информация · ВкусМаркет",
  description:
    "Документы, реквизиты и правовые акты, регулирующие работу маркетплейса ВкусМаркет.",
};

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  company: Building2,
  requisites: Receipt,
  offer: ScrollText,
  privacy: ShieldCheck,
  consent: FileText,
  "marketing-consent": Megaphone,
  delivery: Truck,
  pharmacy: Pill,
  contacts: Phone,
};

export default function LegalPage() {
  return (
    <PageShell className="bg-white">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-ink-100">
        <div className="mx-auto max-w-md px-2 py-3 flex items-center gap-1.5">
          <Link
            href="/profile"
            aria-label="Назад"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="flex-1 truncate text-[16px] font-semibold text-ink-900">
            Юридическая информация
          </h1>
          <BrandPill />
        </div>
      </header>

      <section className="px-4 pt-4 pb-2">
        <p className="text-[13px] text-ink-600">
          Документы, регулирующие работу маркетплейса ВкусМаркет, отношения с
          клиентами, продавцами и партнёрами. Все документы доступны для чтения
          в приложении и для скачивания в PDF.
        </p>
      </section>

      <ul className="px-4 pt-2 pb-8 space-y-2">
        {LEGAL_DOCS.map((item) => {
          const Icon = ICONS[item.slug] ?? FileText;
          return (
            <li key={item.slug}>
              <Link
                href={`/legal/${item.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50/30"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-ink-900">
                    {item.number ? `${item.number}. ` : ""}
                    {item.shortTitle}
                  </div>
                  <div className="line-clamp-2 text-[12px] text-ink-500">
                    {item.description}
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-400" />
              </Link>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
