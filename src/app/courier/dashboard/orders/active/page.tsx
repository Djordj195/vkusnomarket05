import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

const STATUSES = [
  "Направляюсь в точку",
  "Прибыл в точку",
  "Забрал заказ",
  "В пути к клиенту",
  "Прибыл к клиенту",
  "Доставлено",
  "Не удалось доставить",
];

export default function CourierActiveOrdersPage() {
  return (
    <div className="space-y-4">
      <SubpageHeader title="Активные заказы" backHref="/courier/dashboard" />

      <PlaceholderCard
        title="Сейчас активных заказов нет"
        description="Когда вы возьмёте заказ, он появится здесь с кнопками смены статуса и кнопкой 'Открыть в навигаторе'."
      />

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[13px] font-bold text-ink-900">
          Статусы доставки
        </h2>
        <ol className="mt-2 space-y-1.5">
          {STATUSES.map((s, i) => (
            <li
              key={s}
              className="flex items-center gap-2 text-[12px] text-ink-700"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[10px] font-bold text-ink-500">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
