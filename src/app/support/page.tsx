import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { BrandPill } from "@/components/layout/Logo";
import { Phone, MessageCircle, Send, Mail, HelpCircle, FileText, ClipboardList } from "lucide-react";
import { DEFAULT_CONTACTS } from "@/lib/constants";

export default function SupportPage() {
  const wa = DEFAULT_CONTACTS.whatsapp.replace(/[^+\d]/g, "");
  const tg = DEFAULT_CONTACTS.telegram.replace(/^@/, "");

  return (
    <PageShell className="bg-white">
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <span className="w-24" />
          <BrandPill />
          <Link
            href="/faq"
            className="text-[14px] font-semibold text-brand-600"
          >
            Частые вопросы
          </Link>
        </div>
      </div>

      <div className="px-4 pt-6">
        <h1 className="text-[28px] font-extrabold text-ink-900">Чаты</h1>
      </div>

      <ul className="mt-3 px-4 space-y-1">
        <ChatRow
          href={wa ? `https://wa.me/${wa.replace(/^\+/, "")}` : undefined}
          title="Поддержка"
          subtitle="Мы рядом 24/7"
          avatarBg="bg-emerald-500"
          icon={<MessageCircle size={26} />}
        />
        <ChatRow
          href={tg ? `https://t.me/${tg}` : undefined}
          title="Telegram"
          subtitle="Новости и акции"
          avatarBg="bg-sky-500"
          icon={<Send size={24} />}
        />
        <ChatRow
          href={
            DEFAULT_CONTACTS.phone
              ? `tel:${DEFAULT_CONTACTS.phone.replace(/[^+\d]/g, "")}`
              : undefined
          }
          title="Телефон"
          subtitle={DEFAULT_CONTACTS.phone || "Скоро добавим номер"}
          avatarBg="bg-brand-500"
          icon={<Phone size={24} />}
        />
        {DEFAULT_CONTACTS.email && (
          <ChatRow
            href={`mailto:${DEFAULT_CONTACTS.email}`}
            title="Email"
            subtitle={DEFAULT_CONTACTS.email}
            avatarBg="bg-accent-500"
            icon={<Mail size={24} />}
          />
        )}
        <ChatRow
          href="/faq"
          title="Частые вопросы"
          subtitle="Ответы за пару секунд"
          avatarBg="bg-ink-900"
          icon={<HelpCircle size={24} />}
        />
        <ChatRow
          href="/legal"
          title="Юридическая информация"
          subtitle="Оферта, политики, реквизиты"
          avatarBg="bg-brand-600"
          icon={<FileText size={22} />}
        />
        <ChatRow
          href="/support/tickets"
          title="Мои обращения"
          subtitle="Статусы и история"
          avatarBg="bg-amber-500"
          icon={<ClipboardList size={22} />}
        />
      </ul>
    </PageShell>
  );
}

function ChatRow({
  href,
  title,
  subtitle,
  avatarBg,
  icon,
}: {
  href?: string;
  title: string;
  subtitle: string;
  avatarBg: string;
  icon: React.ReactNode;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-ink-50">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${avatarBg} text-white`}
      >
        {icon}
      </span>
      <div className="flex-1 leading-tight">
        <div className="text-[16px] font-bold text-ink-900">{title}</div>
        <div className="mt-0.5 text-[13px] text-ink-500">{subtitle}</div>
      </div>
    </div>
  );
  if (!href) {
    return <li className="opacity-60">{content}</li>;
  }
  const isExternal = href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");
  return (
    <li>
      {isExternal ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        <Link href={href}>{content}</Link>
      )}
    </li>
  );
}
