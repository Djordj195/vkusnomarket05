import { getCurrentVendor } from "@/server/vendor-auth";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { RequisitesEditor } from "./RequisitesEditor";

export const dynamic = "force-dynamic";

export default async function VendorRequisitesPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  return (
    <div className="space-y-4">
      <SubpageHeader title="Реквизиты" backHref="/vendor/dashboard/settings" />
      <p className="text-[13px] text-ink-500">
        Укажите контактные данные и юридическую информацию вашего магазина.
      </p>

      <RequisitesEditor
        initial={{
          phone: vendor.contacts?.phone ?? "",
          email: vendor.contacts?.email ?? "",
          telegram: vendor.contacts?.telegram ?? "",
          whatsapp: vendor.contacts?.whatsapp ?? "",
          legalEntityType: vendor.legalEntityType ?? "NONE",
          legalName: vendor.legalName ?? "",
          inn: vendor.inn ?? "",
        }}
      />
    </div>
  );
}
