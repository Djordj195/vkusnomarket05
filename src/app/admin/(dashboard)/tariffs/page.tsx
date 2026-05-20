import { Wallet, Percent, Receipt } from "lucide-react";

const TARIFFS = [
  {
    name: "Базовый",
    fee: "12%",
    description: "Стандартная комиссия маркетплейса",
  },
  {
    name: "Премиум",
    fee: "8%",
    description: "Для крупных продавцов с оборотом > 1 млн ₽/мес",
  },
  {
    name: "Партнёр",
    fee: "по договору",
    description: "Индивидуальные условия для якорных партнёров",
  },
];

export default function AdminTariffsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Тарифы и комиссии
        </h1>
        <p className="text-[12px] text-ink-500">
          Комиссии маркетплейса, тарифные сетки и условия для продавцов.
        </p>
      </header>

      <ul className="space-y-2">
        {TARIFFS.map((t) => (
          <li
            key={t.name}
            className="rounded-2xl border border-ink-200 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Wallet size={18} />
                </span>
                <div>
                  <div className="text-[14px] font-bold text-ink-900">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    {t.description}
                  </div>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                {t.fee}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Percent size={16} className="text-ink-500" />
          <h2 className="text-[14px] font-bold text-ink-900">
            Редактирование тарифов — в разработке
          </h2>
        </div>
        <p className="mt-2 text-[12px] text-ink-600">
          После подключения ЮKassa (Phase 8) комиссия будет автоматически
          удерживаться при сплит-выплате продавцу. Также появится возможность
          задать индивидуальные ставки по категориям и продавцам.
        </p>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Receipt size={16} className="text-ink-500" />
          <h2 className="text-[14px] font-bold text-ink-900">54-ФЗ</h2>
        </div>
        <p className="mt-2 text-[12px] text-ink-600">
          В рамках агентской схемы чек на каждый заказ формирует продавец через
          свою онлайн-кассу. Интеграционный слой (АТОЛ, Эвотор) подключается в
          Phase 8.
        </p>
      </section>
    </div>
  );
}
