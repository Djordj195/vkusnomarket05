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
} from "lucide-react";

export const metadata = {
  title: "Юридическая информация · ВкусМаркет",
  description:
    "Документы, реквизиты и правовые акты, регулирующие работу маркетплейса ВкусМаркет.",
};

type LegalItem = {
  slug: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
};

export const LEGAL_ITEMS: LegalItem[] = [
  {
    slug: "company",
    title: "О компании",
    description: "Информация об операторе платформы",
    icon: Building2,
  },
  {
    slug: "requisites",
    title: "Реквизиты",
    description: "ИНН, ОГРНИП и юридический адрес",
    icon: Receipt,
  },
  {
    slug: "offer",
    title: "Пользовательская оферта",
    description: "Договор оказания услуг маркетплейса",
    icon: ScrollText,
  },
  {
    slug: "privacy",
    title: "Политика конфиденциальности",
    description: "Как мы обрабатываем персональные данные",
    icon: ShieldCheck,
  },
  {
    slug: "consent",
    title: "Согласие на обработку данных",
    description: "Текст согласия и список целей обработки",
    icon: FileText,
  },
  {
    slug: "delivery",
    title: "Правила доставки и возврата",
    description: "Условия доставки заказов и возврат товаров",
    icon: Truck,
  },
  {
    slug: "pharmacy",
    title: "Информация по аптечному разделу",
    description:
      "Только безрецептурные препараты и БАД, лицензии партнёров",
    icon: Pill,
  },
  {
    slug: "contacts",
    title: "Контакты поддержки",
    description: "Телефон, email и режим работы клиентского сервиса",
    icon: Phone,
  },
];

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
          клиентами, продавцами и партнёрами.
        </p>
      </section>

      <ul className="px-4 pt-2 pb-8 space-y-2">
        {LEGAL_ITEMS.map((item) => {
          const Icon = item.icon;
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
                    {item.title}
                  </div>
                  <div className="truncate text-[12px] text-ink-500">
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
