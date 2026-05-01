import { listCouriers } from "@/server/couriers-store";
import { CourierManager } from "./CourierManager";

export const dynamic = "force-dynamic";

export default async function AdminCouriersPage() {
  const couriers = await listCouriers();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[24px] font-extrabold text-ink-900">Курьеры</h1>
        <p className="text-[14px] text-ink-500">
          Добавляйте курьеров и назначайте их на заказы вручную.
        </p>
      </header>
      <CourierManager initialCouriers={couriers} />
    </div>
  );
}
