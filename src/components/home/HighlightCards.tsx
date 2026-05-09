import Link from "next/link";
import Image from "next/image";

type Card = {
  href: string;
  title: string;
  subtitle: string;
  image: string;
  bg: string;
};

const CARDS: Card[] = [
  {
    href: "/profile",
    title: "Профиль покупателя",
    subtitle: "Адрес, история заказов, избранное",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=480&q=70",
    bg: "bg-ink-100",
  },
  {
    href: "/orders",
    title: "Доставка за час",
    subtitle: "По Кизляру и району · от 500 ₽",
    image:
      "https://images.unsplash.com/photo-1590004953868-c0f9a90fb4e2?auto=format&fit=crop&w=480&q=70",
    bg: "bg-warm-100",
  },
];

export function HighlightCards() {
  return (
    <section>
      <h2 className="mb-3 px-4 text-[18px] font-bold text-ink-900">
        Не пропустите
      </h2>
      <div className="-mx-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-4 pb-1">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`relative flex h-[148px] w-[280px] shrink-0 overflow-hidden rounded-3xl ${c.bg} card-shadow`}
            >
              <div className="flex flex-1 flex-col justify-between p-4">
                <div className="text-[18px] font-bold leading-tight text-ink-900">
                  {c.title}
                </div>
                <div className="text-[13px] text-ink-600">{c.subtitle}</div>
              </div>
              <div className="relative w-[120px] shrink-0">
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
