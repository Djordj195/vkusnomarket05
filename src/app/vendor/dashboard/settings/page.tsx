import Link from "next/link";
import {
  Building2,
  FileText,
  Bell,
  Plug,
  Store,
  Wallet,
  MessageSquare,
  Users,
  ChevronRight,
} from "lucide-react";
import { getCurrentVendor } from "@/server/vendor-auth";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";

const SECTIONS = [
  {
    href: "/vendor/dashboard/storefront",
    label: "Витрина",
    sub: "Логотип, баннер, описание",
    icon: Store,
  },
  {
    href: "/vendor/dashboard/reviews",
    label: "Отзывы",
    sub: "Список и ответы",
    icon: MessageSquare,
  },
  {
    href: "/vendor/dashboard/finances",
    label: "Финансы",
    sub: "Тариф и выплаты",
    icon: Wallet,
  },
  {
    href: "/vendor/dashboard/staff",
    label: "Сотрудники и роли",
    sub: "Команда и доступы",
    icon: Users,
  },
];

const STUBS = [
  {
    href: "/vendor/dashboard/settings/requisites",
    label: "Реквизиты",
    sub: "Юр.лицо, ИНН, банковские данные",
    icon: Building2,
  },
  {
    href: "/vendor/dashboard/settings/documents",
    label: "Документы",
    sub: "Лицензии, сертификаты, договоры",
    icon: FileText,
  },
  {
    href: "/vendor/dashboard/settings/notifications",
    label: "Уведомления",
    sub: "SMS, email, push",
    icon: Bell,
  },
  {
    href: "/vendor/dashboard/settings/integrations",
    label: "Интеграции",
    sub: "Касса, бухгалтерия, маркетплейсы",
    icon: Plug,
  },
];

export default async function VendorSettingsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  return (
    <div className="space-y-4">
      <SubpageHeader title="Ещё" />

      <section>
        <h2 className="mb-2 text-[14px] font-bold text-ink-900">
          Другие разделы
        </h2>
        <ul className="space-y-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-ink-900">
                      {s.label}
                    </div>
                    <div className="truncate text-[11px] text-ink-500">
                      {s.sub}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-ink-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-[14px] font-bold text-ink-900">Настройки</h2>
        <ul className="space-y-2">
          {STUBS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-ink-900">
                      {s.label}
                    </div>
                    <div className="truncate text-[11px] text-ink-500">
                      {s.sub}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-ink-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl bg-ink-50 p-4 text-[12px] text-ink-600">
        <div className="font-bold text-ink-900">Юридическая информация</div>
        <p className="mt-1">
          Документы платформы, правила работы и условия партнёрства:{" "}
          <Link
            href="/legal"
            className="font-semibold text-brand-700 hover:underline"
          >
            /legal
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
