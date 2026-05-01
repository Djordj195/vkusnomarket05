import { listOrders } from "@/server/orders-store";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const orders = await listOrders();
  // Группируем заказы по телефону клиента
  const map = new Map<
    string,
    { name: string; phone: string; orders: number; total: number }
  >();
  for (const o of orders) {
    const key = o.customerPhone;
    const cur = map.get(key);
    if (cur) {
      cur.orders += 1;
      cur.total += o.total;
    } else {
      map.set(key, {
        name: o.customerName,
        phone: o.customerPhone,
        orders: 1,
        total: o.total,
      });
    }
  }
  const customers = Array.from(map.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[24px] font-extrabold text-ink-900">Клиенты</h1>
        <p className="text-[14px] text-ink-500">
          Список клиентов формируется по телефонам из заказов.
        </p>
      </header>

      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
          <Users size={32} className="text-ink-400" />
          <h2 className="mt-3 text-[16px] font-bold text-ink-900">
            Клиентов пока нет
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            Они появятся здесь после первого заказа.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 text-left text-ink-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Имя</th>
                <th className="px-4 py-3 font-semibold">Телефон</th>
                <th className="px-4 py-3 font-semibold">Заказов</th>
                <th className="px-4 py-3 font-semibold">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone} className="border-t border-ink-100">
                  <td className="px-4 py-3 font-semibold text-ink-900">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    <a
                      href={`tel:${c.phone.replace(/[^+\d]/g, "")}`}
                      className="text-brand-600 hover:text-brand-700"
                    >
                      {c.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3">{c.orders}</td>
                  <td className="px-4 py-3 font-semibold">
                    {new Intl.NumberFormat("ru-RU").format(c.total)} ₽
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
