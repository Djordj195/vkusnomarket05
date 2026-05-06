import Link from "next/link";
import type { Category } from "@/lib/types";

function CategoryThumb({ cat, size }: { cat: Category; size: "lg" | "sm" }) {
  const box = size === "lg" ? "h-12 w-12 text-[34px]" : "h-10 w-10 text-[28px]";
  if (cat.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cat.image}
        alt={cat.name}
        className={`${box} rounded-xl object-cover`}
      />
    );
  }
  return <div className={`${box} flex items-center justify-center leading-none`}>{cat.emoji}</div>;
}

export function CategoryGrid({ items }: { items: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="group flex flex-col justify-between rounded-2xl bg-ink-50 p-4 transition hover:bg-ink-100"
        >
          <CategoryThumb cat={cat} size="lg" />
          <div className="mt-3">
            <h3 className="text-[14px] font-semibold leading-tight text-ink-900">
              {cat.name}
            </h3>
            <p className="mt-0.5 text-[12px] text-ink-500">
              {cat.itemsCount} товаров
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CategoryRail({ items }: { items: Category[] }) {
  return (
    <div className="-mx-4 overflow-x-auto no-scrollbar">
      <div className="flex gap-3 px-4 pb-1">
        {items.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="flex w-[120px] shrink-0 flex-col items-start rounded-2xl bg-ink-50 p-3 transition hover:bg-ink-100"
          >
            <CategoryThumb cat={cat} size="sm" />
            <h4 className="mt-3 text-[13px] font-semibold leading-tight text-ink-900">
              {cat.name}
            </h4>
            <span className="mt-0.5 text-[11px] text-ink-500">
              {cat.itemsCount}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
