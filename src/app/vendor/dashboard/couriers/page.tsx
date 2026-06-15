import { getCurrentVendor } from "@/server/vendor-auth";
import { listCouriers } from "@/server/couriers-store";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { VendorCourierManager } from "./VendorCourierManager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorCouriersPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vendor/login");

  const allCouriers = await listCouriers();
  const myCouriers = allCouriers.filter((c) => c.shopId === vendor.id);

  return (
    <div className="space-y-4">
      <SubpageHeader title="Курьеры" />
      <p className="text-[13px] text-ink-500">
        Управление вашими курьерами. Добавляйте курьеров, связывайтесь
        с ними напрямую через звонок, WhatsApp или Telegram.
      </p>
      <VendorCourierManager couriers={myCouriers} />
    </div>
  );
}
