import Link from "next/link";
import { listOrders } from "@/server/orders-store";
import { listCouriers } from "@/server/couriers-store";
import { ClipboardList } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listOrders();
  const couriers = await listCouriers();
  const courierMap = new Map(couriers.map((c) => [c.id, c]));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[24px] font-extrabold text-ink-900">Заказы</h1>
        <p className="text-[14px] text-ink-500">
          Принимайте заказы, меняйте статус и назначайте курьеров.
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
          <ClipboardList size={32} className="text-ink-400" />
          <h2 className="mt-3 text-[16px] font-bold text-ink-900">
            Заказов пока нет
          </h2>
          <p className="mt-1 max-w-xs text-[13px] text-ink-500">
            Когда клиент оформит заказ, он появится здесь, и вы получите
            уведомление в Telegram.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 text-left text-ink-600">
              <tr>
                <Th>№</Th>
                <Th>Дата</Th>
                <Th>Клиент</Th>
                <Th>Сумма</Th>
                <Th>Статус</Th>
                <Th>Курьер</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-ink-100">
                  <Td>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-semibold text-brand-700 hover:text-brand-800"
                    >
                      № {o.number}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {formatDate(o.createdAt)}
                  </Td>
                  <Td>
                    <div className="font-medium text-ink-900">
                      {o.customerName}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      {o.customerPhone}
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap font-semibold">
                    {formatPrice(o.total)}
                  </Td>
                  <Td>
                    <Badge tone="brand">
                      {ORDER_STATUS_LABELS[o.status]}
                    </Badge>
                  </Td>
                  <Td>
                    {o.courierId
                      ? courierMap.get(o.courierId)?.name ?? "—"
                      : "—"}
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
                    >
                      Открыть
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
