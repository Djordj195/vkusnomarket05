import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

const ITEMS = [
  { name: "Касса (54-ФЗ)", description: "АТОЛ, Эвотор, Бизнес.ру" },
  { name: "Бухгалтерия", description: "1С, Контур, Мое дело" },
  { name: "Маркетплейсы", description: "Яндекс Еда, Delivery Club" },
];

export default function VendorIntegrationsPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader
        title="Интеграции"
        backHref="/vendor/dashboard/settings"
      />

      <ul className="space-y-2">
        {ITEMS.map((c) => (
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
        title="Подключения появятся после интеграционного слоя"
        description="После запуска ЮKassa (Phase 8) и фискализации по 54-ФЗ откроется набор API для подключения касс, бухгалтерии и других сервисов."
      />
    </div>
  );
}
