import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Phone, MessageCircle, Send, Mail } from "lucide-react";
import { DEFAULT_CONTACTS } from "@/lib/constants";

export default function SupportPage() {
  const wa = DEFAULT_CONTACTS.whatsapp.replace(/[^+\d]/g, "");
  const tg = DEFAULT_CONTACTS.telegram.replace(/^@/, "");

  return (
    <PageShell>
      <Header variant="page" title="Поддержка" showBack />
      <div className="px-4 pt-2 pb-4 space-y-4">
        <p className="text-[14px] text-ink-600">
          Свяжитесь с нами любым удобным способом — мы ответим быстро.
        </p>

        <ul className="space-y-2">
          <ContactItem
            icon={<MessageCircle size={20} />}
            title="WhatsApp"
            subtitle={DEFAULT_CONTACTS.whatsapp || "Скоро добавим номер"}
            href={wa ? `https://wa.me/${wa.replace(/^\+/, "")}` : undefined}
            colorClass="bg-emerald-500 text-white"
          />
          <ContactItem
            icon={<Send size={20} />}
            title="Telegram"
            subtitle={DEFAULT_CONTACTS.telegram || "Скоро добавим аккаунт"}
            href={tg ? `https://t.me/${tg}` : undefined}
            colorClass="bg-sky-500 text-white"
          />
          <ContactItem
            icon={<Phone size={20} />}
            title="Телефон"
            subtitle={DEFAULT_CONTACTS.phone || "Скоро добавим номер"}
            href={
              DEFAULT_CONTACTS.phone
                ? `tel:${DEFAULT_CONTACTS.phone.replace(/[^+\d]/g, "")}`
                : undefined
            }
            colorClass="bg-brand-600 text-white"
          />
          {DEFAULT_CONTACTS.email && (
            <ContactItem
              icon={<Mail size={20} />}
              title="Email"
              subtitle={DEFAULT_CONTACTS.email}
              href={`mailto:${DEFAULT_CONTACTS.email}`}
              colorClass="bg-accent-500 text-white"
            />
          )}
        </ul>

        <Link
          href="/"
          className="block text-center text-[13px] text-ink-500 hover:text-ink-800"
        >
          Вернуться в каталог
        </Link>
      </div>
    </PageShell>
  );
}

function ContactItem({
  icon,
  title,
  subtitle,
  href,
  colorClass,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href?: string;
  colorClass: string;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-200 p-4 hover:bg-ink-50">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}`}
      >
        {icon}
      </span>
      <div className="flex-1 leading-tight">
        <div className="text-[15px] font-bold text-ink-900">{title}</div>
        <div className="mt-0.5 text-[13px] text-ink-500">{subtitle}</div>
      </div>
    </div>
  );
  if (!href) {
    return <li className="opacity-60">{content}</li>;
  }
  return (
    <li>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    </li>
  );
}
