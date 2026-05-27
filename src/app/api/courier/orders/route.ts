import { NextResponse } from "next/server";
import { getCurrentCourier } from "@/server/courier-auth";
import {
  listActiveOrdersByCourier,
  listOrderHistoryByCourier,
} from "@/server/orders-store";
import { getVendorById } from "@/server/vendors-store";
import { listCities } from "@/server/cities-store";

/**
 * Возвращает заказы текущего курьера. ?scope=active|history (по умолчанию active).
 * Для каждой записи прикладывает геолокацию точки забора (центр города продавца)
 * и контакты продавца — этого достаточно для отрисовки маршрута на карте.
 */
export async function GET(req: Request) {
  const courier = await getCurrentCourier();
  if (!courier) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope =
    new URL(req.url).searchParams.get("scope") === "history"
      ? "history"
      : "active";

  const orders =
    scope === "active"
      ? await listActiveOrdersByCourier(courier.id)
      : await listOrderHistoryByCourier(courier.id);

  const cities = await listCities();
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const enriched = await Promise.all(
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

  return NextResponse.json({ scope, items: enriched });
}
