import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Store } from "lucide-react";
import { listShops } from "@/server/shops-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Лавки",
};

export default async function ShopsPage() {
  const shops = await listShops();

  return (
    <PageShell>
      <Header variant="page" title="Лавки" showBack />
      <div className="px-4 pt-2 pb-4 space-y-4">
        <div className="rounded-2xl bg-brand-50 p-4">
          <h2 className="text-[15px] font-bold text-ink-900">
            Все магазины и лавки
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-500">
            Откройте лавку, чтобы увидеть её товары и контакты.
          </p>
        </div>

        {shops.length > 0 ? (
          <ul className="space-y-2">
            {shops.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/shop/${s.slug}`}
                  className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3 hover:bg-ink-100"
                >
                  {s.cover ? (
                    <Image
                      src={s.cover}
                      alt={s.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white">
                      <Store size={28} className="text-ink-400" />
                    </div>
                  )}
                  <div className="flex-1 leading-tight">
                    <div className="text-[15px] font-bold text-ink-900">
                      {s.name}
                    </div>
                    {s.description && (
                      <div className="mt-0.5 line-clamp-2 text-[12px] text-ink-500">
                        {s.description}
                      </div>
                    )}
                    <div className="mt-1 text-[11px] font-medium text-brand-600">
                      {s.isOpen === false ? "Закрыто" : "Открыто"}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Store}
            title="Лавок пока нет"
            description="Скоро здесь появятся магазины и лавки."
          />
        )}
      </div>
    </PageShell>
  );
}
