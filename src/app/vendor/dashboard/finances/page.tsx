import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

export default function VendorFinancesPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader title="Финансы" />
      <p className="text-[13px] text-ink-500">
        Тариф, комиссия маркетплейса, выплаты, акты и история транзакций.
      </p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Box label="Тариф" value="Базовый" />
        <Box label="Комиссия" value="Договорная" />
        <Box label="К выплате" value="—" />
        <Box label="История" value="—" />
      </section>

      <PlaceholderCard
        title="Подключение выплат в разработке"
        description="После интеграции ЮKassa (Phase 5) вы сможете получать выплаты по сплит-схеме напрямую на счёт магазина, а маркетплейс будет автоматически удерживать комиссию. Фискализация по 54-ФЗ — на стороне продавца."
      />
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="mt-1 text-[16px] font-extrabold text-ink-900">
        {value}
      </div>
    </div>
  );
}
