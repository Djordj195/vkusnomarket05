import Link from "next/link";
import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

type Tab = { key: string; label: string };

const TABS: Tab[] = [
  { key: "all", label: "Все" },
  { key: "new", label: "Новые" },
  { key: "confirmed", label: "Подтв." },
  { key: "preparing", label: "В сборке" },
  { key: "ready", label: "Готовы" },
  { key: "delivering", label: "В доставке" },
  { key: "done", label: "Завершено" },
  { key: "cancelled", label: "Отмены" },
];

type SearchParams = Promise<{ status?: string }>;

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const active = sp.status ?? "all";

  return (
    <div className="space-y-4">
      <SubpageHeader title="Заказы" />

      <nav
        className="-mx-1 flex gap-2 overflow-x-auto px-1"
        aria-label="Фильтр статусов"
      >
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={
                tab.key === "all"
                  ? "/vendor/dashboard/orders"
                  : `/vendor/dashboard/orders?status=${tab.key}`
              }
              className={
                isActive
                  ? "shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                  : "shrink-0 rounded-full bg-ink-100 px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-ink-200"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <PlaceholderCard
        title="Заказов пока нет"
        description="Когда клиент оформит заказ в вашем магазине, он появится здесь. Жизненный цикл: новый → подтверждён → в сборке → готов → передан курьеру → завершён."
      />
    </div>
  );
}
