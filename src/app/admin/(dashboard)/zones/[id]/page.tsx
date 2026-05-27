import { notFound } from "next/navigation";
import { listVendors } from "@/server/vendors-store";
import { listAllCities } from "@/server/cities-store";
import { getZone } from "@/server/zones-store";
import { ZoneEditor } from "../ZoneEditor";

export const dynamic = "force-dynamic";

export default async function EditZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [zone, vendors, cities] = await Promise.all([
    getZone(id),
    listVendors(),
    listAllCities(),
  ]);

  if (!zone) notFound();

  return (
    <ZoneEditor
      isNew={false}
      initial={{
        id: zone.id,
        vendorId: zone.vendorId,
        name: zone.name,
        polygon: zone.polygon,
        minOrder: zone.minOrder,
        deliveryFee: zone.deliveryFee,
        freeFrom: zone.freeFrom,
        etaMin: zone.etaMin,
        etaMax: zone.etaMax,
        isActive: zone.isActive,
      }}
      vendors={vendors.map((v) => ({
        id: v.id,
        brandName: v.brandName,
        cityId: v.cityId,
      }))}
      cities={cities.map((c) => ({
        id: c.id,
        name: c.name,
        lat: c.lat,
        lng: c.lng,
      }))}
    />
  );
}
