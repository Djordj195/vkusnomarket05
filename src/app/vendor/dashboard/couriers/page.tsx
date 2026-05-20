import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

export default function VendorCouriersPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader title="Курьеры" />
      <p className="text-[13px] text-ink-500">
        Свои курьеры магазина и KPI. Можно использовать курьеров платформы —
        они подключаются автоматически при поступлении заказа.
      </p>

      <PlaceholderCard
        title="Список курьеров появится после регистрации"
        description="Чтобы добавить курьера, отправьте ему ссылку на регистрацию в курьерском приложении и привяжите к вашему магазину. Также вы сможете назначать заказы, видеть статусы и метрики."
      />
    </div>
  );
}
