import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

export default function CourierMapPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader title="Карта" backHref="/courier/dashboard" />
      <div className="aspect-[4/5] w-full rounded-2xl border border-ink-200 bg-ink-100" />
      <PlaceholderCard
        title="Карта подключается в следующем апдейте"
        description="Здесь будет интерактивная карта 2GIS / Яндекс с маршрутом, точкой забора и адресом доставки. Также — кнопки 'Открыть в навигаторе' и 'Позвонить клиенту'."
      />
    </div>
  );
}
