import { Receipt } from "lucide-react";
import { listTariffs } from "@/server/tariffs-store";
import { TariffsList } from "./TariffsList";

export default async function AdminTariffsPage() {
  const tariffs = await listTariffs();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Тарифы и комиссии
        </h1>
        <p className="text-[12px] text-ink-500">
          Управление комиссиями маркетплейса. Назначьте тариф продавцу в его
          карточке.
        </p>
      </header>

      <TariffsList tariffs={tariffs} />

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Receipt size={16} className="text-ink-500" />
          <h2 className="text-[14px] font-bold text-ink-900">54-ФЗ</h2>
        </div>
        <p className="mt-2 text-[12px] text-ink-600">
          В рамках агентской схемы чек на каждый заказ формирует продавец через
          свою онлайн-кассу. Интеграционный слой (АТОЛ, Эвотор) подключается
          отдельно.
        </p>
      </section>
    </div>
  );
}
