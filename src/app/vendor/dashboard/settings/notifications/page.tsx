import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

const CHANNELS = [
  { name: "SMS", description: "Новые заказы, отмены, выплаты" },
  { name: "Email", description: "Акты и финансовые отчёты" },
  { name: "Push", description: "Реальное время — статусы заказов" },
];

export default function VendorNotificationsPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader
        title="Уведомления"
        backHref="/vendor/dashboard/settings"
      />

      <ul className="space-y-2">
        {CHANNELS.map((c) => (
          <li
            key={c.name}
            className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-3"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-ink-900">{c.name}</div>
              <div className="truncate text-[11px] text-ink-500">
                {c.description}
              </div>
            </div>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
              Скоро
            </span>
          </li>
        ))}
      </ul>

      <PlaceholderCard
        title="Настройка каналов — в разработке"
        description="Управление подписками будет доступно после Phase 9. До этого все важные события уходят на контактный телефон, указанный в реквизитах."
      />
    </div>
  );
}
