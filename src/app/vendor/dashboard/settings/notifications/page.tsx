import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { requireVendor } from "@/server/vendor-auth";
import { VendorPushToggle } from "./VendorPushToggle";
import { VendorNotificationChannels } from "./VendorNotificationChannels";

export const dynamic = "force-dynamic";

export default async function VendorNotificationsPage() {
  const vendor = await requireVendor();
  const vapidPublicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  return (
    <div className="space-y-4">
      <SubpageHeader
        title="Уведомления"
        backHref="/vendor/dashboard/settings"
      />

      <VendorPushToggle vendorId={vendor.id} vapidPublicKey={vapidPublicKey} />

      <VendorNotificationChannels
        vendorId={vendor.id}
        hasEmail={!!vendor.contacts.email}
        hasPhone={!!vendor.contacts.phone}
      />
    </div>
  );
}
