import Link from "next/link";
import { Map as MapIcon, Plus } from "lucide-react";
import { listVendors } from "@/server/vendors-store";
import { listZones } from "@/server/zones-store";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminZonesPage() {
  const [zones, vendors] = await Promise.all([listZones(), listVendors()]);
  const byVendor = new Map(vendors.map((v) => [v.id, v]));

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold text-ink-900">
            Зоны доставки
          </h1>
          <p className="text-[12px] text-ink-500">
            Полигоны и тарифные сетки. Рисуйте границы прямо на карте.
          </p>
        </div>
        <Link
          href="/admin/zones/new"
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-bold text-white hover:bg-brand-700"
        >
          <Plus size={14} />
          Новая зона
        </Link>
      </header>

      {zones.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
            <MapIcon size={22} />
          </div>
          <h2 className="mt-3 text-[15px] font-extrabold text-ink-900">
            Зон пока нет
          </h2>
          <p className="mt-1 text-[12px] text-ink-500">
            Создайте первую зону доставки и привяжите её к продавцу. Полигон
            рисуется кликами по карте.
          </p>
          <Link
            href="/admin/zones/new"
            className="mt-3 inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-bold text-white hover:bg-brand-700"
          >
            <Plus size={14} />
            Создать зону
          </Link>
        </section>
      ) : (
        <ul className="space-y-2">
          {zones.map((z) => {
            const vendor = byVendor.get(z.vendorId);
            return (
              <li
                key={z.id}
                className="rounded-2xl border border-ink-200 bg-white p-3"
              >
                <Link
                  href={`/admin/zones/${z.id}`}
                  className="block hover:opacity-90"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[14px] font-bold text-ink-900">
                          {z.name}
                        </span>
                        {z.isActive ? (
                          <Badge tone="success">Активна</Badge>
                        ) : (
                          <Badge tone="neutral">Выключена</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-ink-500">
                        {vendor ? vendor.brandName : `Продавец ${z.vendorId}`}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-ink-600">
                        <span>
                          Мин.заказ:{" "}
                          <b className="text-ink-900">
                            {formatPrice(z.minOrder)}
                          </b>
                        </span>
                        <span>
                          Доставка:{" "}
                          <b className="text-ink-900">
                            {formatPrice(z.deliveryFee)}
                          </b>
                        </span>
                        {z.freeFrom !== null && (
                          <span>
                            Бесплатно от:{" "}
                            <b className="text-ink-900">
                              {formatPrice(z.freeFrom)}
                            </b>
                          </span>
                        )}
                        <span>
                          {z.etaMin}–{z.etaMax} мин
                        </span>
                        <span>{z.polygon.length} точек</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
