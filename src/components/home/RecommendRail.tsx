import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";

type Story = {
  href: string;
  title: string;
  image: string;
};

const PROMO_STORIES: Story[] = [
  {
    href: "/weekly",
    title: "Скидки недели",
    image:
      "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=480&q=70",
  },
  {
    href: "/section/food",
    title: "Готовая еда",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=480&q=70",
  },
  {
    href: "/section/market",
    title: "Свежее с рынка",
    image:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=480&q=70",
  },
  {
    href: "/shops",
    title: "Лавки и магазины",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=480&q=70",
  },
];

export function RecommendRail({
  weekly,
  popular,
}: {
  weekly: Product[];
  popular: Product[];
}) {
  const productStories: Story[] = [...weekly, ...popular]
    .slice(0, 8)
    .map((p) => ({
      href: `/product/${p.slug}`,
      title: p.name,
      image: p.image,
    }));
  const stories = [...PROMO_STORIES, ...productStories];

  return (
    <section>
      <h2 className="mb-2 px-4 text-[18px] font-bold text-ink-900">
        Рекомендуем
      </h2>
      <div className="-mx-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-4 pb-1">
          {stories.map((s) => (
            <Link
              key={s.href + s.title}
              href={s.href}
              className="relative flex h-[160px] w-[112px] shrink-0 flex-col justify-end overflow-hidden rounded-2xl bg-ink-900 ring-2 ring-accent-300 ring-offset-1"
            >
              <Image
                src={s.image}
                alt={s.title}
                fill
                sizes="120px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="relative p-2.5 text-[12px] font-semibold leading-tight text-white">
                {s.title}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
