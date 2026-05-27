import { redirect } from "next/navigation";
import { getCurrentCourier } from "@/server/courier-auth";
import { listActiveOrdersByCourier } from "@/server/orders-store";
import { getVendorById } from "@/server/vendors-store";
import { listCities } from "@/server/cities-store";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { CourierMap } from "./CourierMap";
import type { CourierOrderItem } from "@/lib/courier-orders";

export const dynamic = "force-dynamic";

export default async function CourierMapPage() {
  const courier = await getCurrentCourier();
  if (!courier) redirect("/courier/login");

  const [orders, cities] = await Promise.all([
    listActiveOrdersByCourier(courier.id),
    listCities(),
  ]);
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const initial: CourierOrderItem[] = await Promise.all(
    orders.map(async (o) => {
      const vendor = o.vendorId ? await getVendorById(o.vendorId) : null;
      const city = vendor ? cityById.get(vendor.cityId) : null;
      return {
        order: o,
        vendor: vendor
          ? {
              id: vendor.id,
              brandName: vendor.brandName,
              slug: vendor.slug,
              phone: vendor.contacts?.phone ?? null,
              logoUrl: vendor.logoUrl ?? null,
            }
          : null,
        pickup:
          city != null
            ? { lat: city.lat, lng: city.lng, label: city.name }
            : null,
      };
    })
  );

  return (
    <div className="space-y-4">
      <SubpageHeader title="Карта и маршрут" backHref="/courier/dashboard" />
      <CourierMap initial={initial} />
    </div>
  );
}
