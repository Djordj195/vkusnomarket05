import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

export default function CourierHistoryHubPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader title="История" backHref="/courier/dashboard" />
      <PlaceholderCard
        title="История смен"
        description="После завершения первой смены здесь появятся заработок, количество доставок, средний рейтинг и пройденное расстояние."
      />
    </div>
  );
}
