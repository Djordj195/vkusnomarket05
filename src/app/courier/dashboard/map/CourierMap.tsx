"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as LMap, Marker as LMarker, Polyline as LPolyline } from "leaflet";
import { Navigation, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CourierOrderItem } from "@/lib/courier-orders";

const POLL_INTERVAL_MS = 8000;
const DEFAULT_CENTER: [number, number] = [43.8478, 46.7141]; // Кизляр

export function CourierMap({ initial }: { initial: CourierOrderItem[] }) {
  const [items, setItems] = useState<CourierOrderItem[]>(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "loading" | "ok" | "denied" | "unsupported"
  >(() => {
    if (typeof navigator === "undefined") return "idle";
    if (!("geolocation" in navigator)) return "unsupported";
    return "loading";
  });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LMap | null>(null);
  const markersRef = useRef<LMarker[]>([]);
  const polylinesRef = useRef<LPolyline[]>([]);
  const meMarkerRef = useRef<LMarker | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/courier/orders?scope=active", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: CourierOrderItem[] };
      setItems(data.items);
    } catch {
      /* silent */
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Геолокация курьера (один раз — обновляем по watchPosition).
  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Динамически грузим leaflet — он несовместим с SSR (трогает window).
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      // Иконки по умолчанию ссылаются на пути в node_modules, которые
      // не существуют после бандлинга. Подменяем на CDN.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapInstanceRef.current) return;
      const map = L.map(mapRef.current).setView(DEFAULT_CENTER, 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      mapInstanceRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
        polylinesRef.current = [];
        meMarkerRef.current = null;
      }
    };
  }, []);

  // Перерисовываем маркеры и маршруты при изменении заказов или позиции курьера.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      for (const m of markersRef.current) m.remove();
      for (const p of polylinesRef.current) p.remove();
      markersRef.current = [];
      polylinesRef.current = [];

      const bounds: [number, number][] = [];

      for (const it of items) {
        if (it.pickup) {
          const m = L.marker([it.pickup.lat, it.pickup.lng])
            .addTo(map)
            .bindPopup(
              `<b>${escapeHtml(it.vendor?.brandName ?? "Магазин")}</b><br/>${escapeHtml(it.pickup.label)}`
            );
          markersRef.current.push(m);
          bounds.push([it.pickup.lat, it.pickup.lng]);
        }
        if (it.order.geo) {
          const m = L.marker([it.order.geo.lat, it.order.geo.lng])
            .addTo(map)
            .bindPopup(
              `<b>Заказ № ${escapeHtml(it.order.number)}</b><br/>${escapeHtml(it.order.address)}`
            );
          markersRef.current.push(m);
          bounds.push([it.order.geo.lat, it.order.geo.lng]);
        }
        if (it.pickup && it.order.geo) {
          const p = L.polyline(
            [
              [it.pickup.lat, it.pickup.lng],
              [it.order.geo.lat, it.order.geo.lng],
            ],
            { color: "#3a7afe", weight: 4, opacity: 0.7, dashArray: "6 6" }
          ).addTo(map);
          polylinesRef.current.push(p);
        }
      }

      if (meMarkerRef.current) {
        meMarkerRef.current.remove();
        meMarkerRef.current = null;
      }
      if (me) {
        const meIcon = L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 0 0 3px rgba(34,197,94,0.3)"></div>`,
          className: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        meMarkerRef.current = L.marker([me.lat, me.lng], { icon: meIcon })
          .addTo(map)
          .bindPopup("Вы здесь");
        bounds.push([me.lat, me.lng]);
      }

      if (bounds.length >= 2) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items, me]);

  const hasOrders = items.length > 0;

  const navAll = useMemo(() => {
    if (items.length === 0) return null;
    const first = items[0];
    if (!first.pickup || !first.order.geo) return null;
    const from = `${first.pickup.lat},${first.pickup.lng}`;
    const to = `${first.order.geo.lat},${first.order.geo.lng}`;
    return `https://yandex.ru/maps/?rtext=${encodeURIComponent(from)}~${encodeURIComponent(to)}&rtt=auto`;
  }, [items]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-3 py-2 text-[12px] text-brand-800">
        <span>
          {geoStatus === "ok" && "Ваша позиция определена"}
          {geoStatus === "loading" && "Определяю вашу позицию…"}
          {geoStatus === "denied" && "Доступ к геолокации запрещён"}
          {geoStatus === "unsupported" && "Геолокация не поддерживается"}
          {geoStatus === "idle" && "Готов к работе"}
        </span>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1 font-semibold text-brand-700 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin" : undefined}
          />
          {refreshing ? "Обновляю…" : "Обновить"}
        </button>
      </div>

      <div
        ref={mapRef}
        className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-ink-200 bg-ink-100"
      />

      {hasOrders ? (
        <>
          <Legend />
          {navAll && (
            <a
              href={navAll}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-[14px] font-bold text-white"
            >
              <Navigation size={16} />
              Открыть маршрут в Яндекс.Картах
            </a>
          )}
        </>
      ) : (
        <EmptyState
          title="На карте пока пусто"
          description="Когда вам назначат заказ, на карте появятся точки забора и доставки, а также пунктирный маршрут между ними."
        />
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-3 text-[12px] text-ink-700">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
        <span>Вы</span>
        <span className="ml-3 inline-block h-3 w-3 rounded-full bg-blue-500" />
        <span>Точка забора и адрес клиента</span>
      </div>
      <div className="mt-2 text-[11px] text-ink-500">
        Пунктирная линия — прямой маршрут «магазин → клиент». Реальная
        прокладка маршрута и пробки — в Яндекс.Картах по кнопке ниже.
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
