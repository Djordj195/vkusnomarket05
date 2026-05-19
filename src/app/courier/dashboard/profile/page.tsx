import Link from "next/link";
import { FileText, ChevronRight, Phone, IdCard, Wallet } from "lucide-react";
import { getCurrentCourier } from "@/server/courier-auth";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";

function formatPhone(digits: string): string {
  if (digits.length !== 11) return `+${digits}`;
  return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

export default async function CourierProfilePage() {
  const courier = await getCurrentCourier();
  if (!courier) return null;

  return (
    <div className="space-y-4">
      <SubpageHeader title="Профиль" backHref="/courier/dashboard" />

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <IdCard size={22} />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-ink-900">
              {courier.type === "platform"
                ? "Курьер платформы"
                : "Курьер магазина"}
            </div>
            <div className="truncate text-[12px] text-ink-500">
              {formatPhone(courier.phone)}
            </div>
          </div>
        </div>
      </section>

      <ul className="space-y-2">
        <Row
          href="/courier/dashboard/documents"
          icon={<FileText size={20} />}
          label="Документы"
          sub="Паспорт, ИНН, мед.книжка"
        />
        <Row
          href="/courier/dashboard/profile"
          icon={<Wallet size={20} />}
          label="Выплаты и баланс"
          sub="История выплат"
        />
        <Row
          href="/support"
          icon={<Phone size={20} />}
          label="Поддержка"
          sub="Связаться со службой поддержки"
        />
      </ul>
    </div>
  );
}

function Row({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-ink-900">
            {label}
          </div>
          <div className="truncate text-[11px] text-ink-500">{sub}</div>
        </div>
        <ChevronRight size={16} className="text-ink-400" />
      </Link>
    </li>
  );
}
