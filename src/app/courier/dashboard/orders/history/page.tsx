import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

export default function CourierHistoryPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader title="История доставок" backHref="/courier/dashboard" />
      <PlaceholderCard
        title="История пуста"
        description="Завершённые заказы и пройденные маршруты появятся здесь после первой смены."
      />
    </div>
  );
}
