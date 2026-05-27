import { listVendors } from "@/server/vendors-store";
import { listAllCities } from "@/server/cities-store";
import { ZoneEditor } from "../ZoneEditor";

export const dynamic = "force-dynamic";

export default async function NewZonePage() {
  const [vendors, cities] = await Promise.all([
    listVendors(),
    listAllCities(),
  ]);

  return (
    <ZoneEditor
      isNew
      initial={{
        vendorId: vendors[0]?.id ?? "",
        name: "Зона доставки",
        polygon: [],
        minOrder: 0,
        deliveryFee: 0,
        freeFrom: null,
        etaMin: 30,
        etaMax: 60,
        isActive: true,
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
