import Link from "next/link";
import { ChevronRight, Send, Salad, Gift, Sparkles } from "lucide-react";

export function IdeasSection() {
  return (
    <section className="space-y-4">
      <h2 className="px-4 text-[20px] font-bold text-ink-900">
        Идеи для покупок
      </h2>

      <div className="px-4">
        <Link
          href="/weekly"
          className="relative flex h-[120px] items-center overflow-hidden rounded-3xl bg-ink-100 p-4 card-shadow"
        >
          <div className="flex-1 leading-tight">
            <div className="text-[18px] font-bold text-ink-900">
              Товары недели
            </div>
            <div className="mt-1 text-[13px] text-ink-600">
              Лучшие цены и свежесть
            </div>
          </div>
          <div className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2">
            <BlobIcon />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        <Link
          href="https://t.me/vkusnomarket05_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex h-[140px] flex-col justify-between overflow-hidden rounded-3xl bg-ink-100 p-4 card-shadow"
        >
          <div className="text-[15px] font-bold leading-tight text-ink-900">
            Telegram
          </div>
          <div className="text-[12px] text-ink-600">Новости и акции</div>
          <Send
            size={56}
            className="pointer-events-none absolute -right-2 -bottom-2 text-sky-500/85"
            strokeWidth={1.5}
          />
        </Link>

        <Link
          href="/?source=food"
          className="relative flex h-[140px] flex-col justify-between overflow-hidden rounded-3xl bg-ink-100 p-4 card-shadow"
        >
          <div className="text-[15px] font-bold leading-tight text-ink-900">
            Что заказать
          </div>
          <div className="text-[12px] text-ink-600">Подскажем готовые блюда</div>
          <Salad
            size={56}
            className="pointer-events-none absolute -right-2 -bottom-2 text-emerald-500/90"
            strokeWidth={1.5}
          />
        </Link>
      </div>

      <h2 className="px-4 pt-2 text-[20px] font-bold text-ink-900">
        Больше бонусов
      </h2>

      <div className="grid grid-cols-2 gap-3 px-4">
        <Link
          href="/profile"
          className="flex h-[120px] flex-col justify-between rounded-3xl bg-ink-100 p-4 card-shadow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">
            <Gift size={20} />
          </div>
          <div className="text-[14px] font-bold leading-tight text-ink-900">
            Бонус за друга
          </div>
        </Link>
        <Link
          href="/weekly"
          className="flex h-[120px] flex-col justify-between rounded-3xl bg-ink-100 p-4 card-shadow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-300 text-ink-900">
            <Sparkles size={20} />
          </div>
          <div className="text-[14px] font-bold leading-tight text-ink-900">
            Скидки недели
          </div>
        </Link>
      </div>

      <h2 className="px-4 pt-2 text-[20px] font-bold text-ink-900">
        Другие разделы
      </h2>

      <div className="px-4">
        <ul className="overflow-hidden rounded-3xl bg-ink-100 card-shadow">
          <RowItem href="/orders" title="Мои заказы" />
          <RowItem href="/favorites" title="Избранное" />
          <RowItem href="/support" title="Поддержка и помощь" />
        </ul>
      </div>
    </section>
  );
}

function RowItem({ href, title }: { href: string; title: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 border-b border-white/60 px-4 py-3.5 last:border-0 hover:bg-white/40"
      >
        <span className="flex-1 text-[14px] font-medium text-ink-900">
          {title}
        </span>
        <ChevronRight size={18} className="text-ink-400" />
      </Link>
    </li>
  );
}

function BlobIcon() {
  return (
    <svg
      width="180"
      height="120"
      viewBox="0 0 180 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="blobA" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6f46ff" />
        </radialGradient>
        <radialGradient id="blobB" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#a855f7" />
        </radialGradient>
        <radialGradient id="blobC" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#ec4899" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="80" r="36" fill="url(#blobA)" opacity="0.9" />
      <circle cx="105" cy="48" r="42" fill="url(#blobB)" opacity="0.9" />
      <circle cx="135" cy="80" r="32" fill="url(#blobC)" opacity="0.9" />
    </svg>
  );
}
