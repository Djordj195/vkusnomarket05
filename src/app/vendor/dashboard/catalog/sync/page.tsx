import { getCurrentVendor } from "@/server/vendor-auth";
import { redirect } from "next/navigation";
import { listSources } from "@/server/catalog-sync-store";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { SyncSourceList } from "./SyncSourceList";

export const dynamic = "force-dynamic";

export default async function VendorCatalogSyncPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vendor/login");

  const sources = await listSources(vendor.id);

  return (
    <div className="space-y-4">
      <SubpageHeader title="Синхронизация каталога" />
      <p className="text-[13px] text-ink-500">
        Подключите внешний источник товаров — и каталог будет обновляться
        автоматически.
      </p>
      <SyncSourceList sources={sources} />
    </div>
  );
}
