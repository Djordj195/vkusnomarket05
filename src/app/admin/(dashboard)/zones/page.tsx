import Link from "next/link";
import { Map } from "lucide-react";

export default function AdminZonesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Зоны доставки
        </h1>
        <p className="text-[12px] text-ink-500">
          Полигоны доставки и тарифные сетки для каждого города. Управление
          через{" "}
          <Link
            href="/admin/cities"
            className="font-semibold text-brand-700 hover:underline"
          >
            раздел городов
          </Link>
          .
        </p>
      </header>

      <section className="rounded-2xl border border-ink-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
          <Map size={22} />
        </div>
        <h2 className="mt-3 text-[15px] font-extrabold text-ink-900">
          Зоны доставки — в разработке
        </h2>
        <p className="mt-1 text-[12px] text-ink-500">
          Здесь появится интерактивная карта с возможностью рисовать полигоны,
          задавать стоимость и время доставки, привязывать зоны к продавцам и
          курьерским сменам.
        </p>
      </section>
    </div>
  );
}
