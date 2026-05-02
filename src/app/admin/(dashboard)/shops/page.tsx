import { Store } from "lucide-react";
import { listShops } from "@/server/shops-store";

export const dynamic = "force-dynamic";

export default async function AdminShopsPage() {
  const shops = await listShops();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[24px] font-extrabold text-ink-900">
          Магазины и лавки
        </h1>
        <p className="text-[14px] text-ink-500">
          Раздел «Лавки» в приложении пока пустой — добавляйте сюда новых
          продавцов, кафе и рестораны.
        </p>
      </header>

      {shops.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
          <Store size={32} className="text-ink-400" />
          <h2 className="mt-3 text-[16px] font-bold text-ink-900">
            Продавцов пока нет
          </h2>
          <p className="mt-1 max-w-sm text-[13px] text-ink-500">
            Когда подключим базу данных, здесь появятся карточки магазинов и
            лавок с их собственными товарами и обложкой.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {shops.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-4"
            >
              <div>
                <div className="font-semibold text-ink-900">{s.name}</div>
                <div className="text-[12px] text-ink-500">{s.description}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
