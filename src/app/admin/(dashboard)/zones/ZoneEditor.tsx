"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  LeafletMouseEvent,
  Map as LMap,
  Marker as LMarker,
  Polygon as LPolygon,
  Polyline as LPolyline,
} from "leaflet";
import {
  ArrowLeft,
  Eraser,
  MapPinned,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  deleteZoneAction,
  saveZoneAction,
  type SaveZoneResult,
} from "@/server/zones-actions";
import type { DeliveryZonePoint } from "@/lib/types";

export type ZoneEditorVendor = {
  id: string;
  brandName: string;
  cityId: string;
};

export type ZoneEditorCity = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type Initial = {
  id?: string;
  vendorId: string;
  name: string;
  polygon: DeliveryZonePoint[];
  minOrder: number;
  deliveryFee: number;
  freeFrom: number | null;
  etaMin: number;
  etaMax: number;
  isActive: boolean;
};

const DEFAULT_FALLBACK: [number, number] = [55.7558, 37.6173]; // Москва (центр РФ)

export function ZoneEditor({
  initial,
  vendors,
  cities,
  isNew,
}: {
  initial: Initial;
  vendors: ZoneEditorVendor[];
  cities: ZoneEditorCity[];
  isNew: boolean;
}) {
  const router = useRouter();
  const [vendorId, setVendorId] = useState(initial.vendorId);
  const [name, setName] = useState(initial.name);
  const [points, setPoints] = useState<DeliveryZonePoint[]>(initial.polygon);
  const [minOrder, setMinOrder] = useState<number>(initial.minOrder);
  const [deliveryFee, setDeliveryFee] = useState<number>(initial.deliveryFee);
  const [freeFromRaw, setFreeFromRaw] = useState<string>(
    initial.freeFrom === null ? "" : String(initial.freeFrom)
  );
  const [etaMin, setEtaMin] = useState<number>(initial.etaMin);
  const [etaMax, setEtaMax] = useState<number>(initial.etaMax);
  const [isActive, setIsActive] = useState<boolean>(initial.isActive);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const vendorCity = vendors.find((v) => v.id === vendorId);
  const focusCity =
    cities.find((c) => c.id === vendorCity?.cityId) ?? cities[0];

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LMap | null>(null);
  const markersRef = useRef<LMarker[]>([]);
  const polygonRef = useRef<LPolygon | null>(null);
  const polylineRef = useRef<LPolyline | null>(null);
  const pointsRef = useRef<DeliveryZonePoint[]>(points);

  // Sync ref → state в effect, чтобы избежать «Cannot update ref during render».
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    if (!mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const iconRetinaUrl =
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
      const iconUrl =
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
      const shadowUrl =
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
      delete (
        L.Icon.Default.prototype as { _getIconUrl?: () => string }
      )._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

      const center: [number, number] = focusCity
        ? [focusCity.lat, focusCity.lng]
        : DEFAULT_FALLBACK;
      const map = L.map(mapRef.current).setView(center, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      map.on("click", (e: LeafletMouseEvent) => {
        const next = [
          ...pointsRef.current,
          { lat: e.latlng.lat, lng: e.latlng.lng },
        ];
        setPoints(next);
      });

      mapInstanceRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // We init the map once; focusCity updates handled via a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When vendor (and thus city) changes, recenter the map.
  useEffect(() => {
    if (!mapInstanceRef.current || !focusCity) return;
    mapInstanceRef.current.setView(
      [focusCity.lat, focusCity.lng],
      mapInstanceRef.current.getZoom() < 11
        ? 12
        : mapInstanceRef.current.getZoom()
    );
  }, [focusCity?.id, focusCity?.lat, focusCity?.lng, focusCity]);

  // Redraw markers + polygon whenever points change.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapInstanceRef.current) return;
      const map = mapInstanceRef.current;

      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      if (polygonRef.current) {
        polygonRef.current.remove();
        polygonRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      points.forEach((p, idx) => {
        const m = L.marker([p.lat, p.lng], { draggable: true });
        m.bindTooltip(`#${idx + 1}`, {
          permanent: true,
          direction: "right",
          className: "zone-tooltip",
          offset: [10, 0],
        });
        m.on("dragend", () => {
          const latlng = m.getLatLng();
          setPoints((prev) =>
            prev.map((pp, i) =>
              i === idx ? { lat: latlng.lat, lng: latlng.lng } : pp
            )
          );
        });
        m.on("contextmenu", () => {
          setPoints((prev) => prev.filter((_, i) => i !== idx));
        });
        m.addTo(map);
        markersRef.current.push(m);
      });

      if (points.length >= 3) {
        polygonRef.current = L.polygon(
          points.map((p) => [p.lat, p.lng]),
          {
            color: "#2563eb",
            weight: 2,
            fillColor: "#3b82f6",
            fillOpacity: 0.18,
          }
        ).addTo(map);
      } else if (points.length === 2) {
        polylineRef.current = L.polyline(
          points.map((p) => [p.lat, p.lng]),
          { color: "#2563eb", weight: 2, dashArray: "6, 6" }
        ).addTo(map);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [points]);

  const undoLast = useCallback(() => {
    setPoints((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    setPoints([]);
  }, []);

  const onSave = useCallback(() => {
    setError(null);
    if (points.length < 3) {
      setError("Полигон должен содержать минимум 3 точки.");
      return;
    }
    if (!vendorId) {
      setError("Выберите продавца.");
      return;
    }
    const fd = new FormData();
    if (initial.id) fd.set("id", initial.id);
    fd.set("vendorId", vendorId);
    fd.set("name", name);
    fd.set("polygon", JSON.stringify(points));
    fd.set("minOrder", String(minOrder));
    fd.set("deliveryFee", String(deliveryFee));
    fd.set("freeFrom", freeFromRaw);
    fd.set("etaMin", String(etaMin));
    fd.set("etaMax", String(etaMax));
    if (isActive) fd.set("isActive", "on");

    startTransition(async () => {
      const res: SaveZoneResult = await saveZoneAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (isNew) {
        router.push(`/admin/zones/${res.id}`);
      } else {
        router.refresh();
      }
    });
  }, [
    points,
    vendorId,
    name,
    minOrder,
    deliveryFee,
    freeFromRaw,
    etaMin,
    etaMax,
    isActive,
    isNew,
    initial.id,
    router,
  ]);

  const onDelete = useCallback(() => {
    if (!initial.id) return;
    if (!confirm("Удалить зону безвозвратно?")) return;
    const fd = new FormData();
    fd.set("id", initial.id);
    startTransition(async () => {
      const res = await deleteZoneAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/admin/zones");
    });
  }, [initial.id, router]);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => router.push("/admin/zones")}
            className="mb-2 inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-700"
          >
            <ArrowLeft size={12} />К списку зон
          </button>
          <h1 className="text-[22px] font-extrabold text-ink-900">
            {isNew ? "Новая зона доставки" : "Редактирование зоны"}
          </h1>
          <p className="text-[12px] text-ink-500">
            Кликайте по карте, чтобы добавить точки полигона. Маркеры можно
            перетаскивать; правый клик удаляет точку.
          </p>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-[12px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 size={14} />
            Удалить
          </button>
        )}
      </header>

      <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        <div className="border-b border-ink-100 bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-ink-700">
              <MapPinned size={12} /> Точек: {points.length}
            </span>
            <button
              type="button"
              onClick={undoLast}
              disabled={points.length === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2 py-1 hover:border-brand-300 disabled:opacity-50"
            >
              <Undo2 size={12} /> Отменить точку
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={points.length === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2 py-1 hover:border-red-300 disabled:opacity-50"
            >
              <Eraser size={12} /> Очистить
            </button>
            <button
              type="button"
              onClick={() => setPoints(initial.polygon)}
              disabled={points === initial.polygon}
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2 py-1 hover:border-brand-300 disabled:opacity-50"
            >
              <RotateCcw size={12} /> Сбросить
            </button>
          </div>
        </div>
        <div ref={mapRef} className="h-[360px] w-full" />
      </section>

      <section className="space-y-3 rounded-2xl border border-ink-200 bg-white p-3">
        <Field label="Продавец">
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900"
          >
            <option value="">— выберите —</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brandName}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Название зоны">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Центр"
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Мин. заказ, ₽">
            <input
              type="number"
              min={0}
              value={minOrder}
              onChange={(e) => setMinOrder(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900"
            />
          </Field>
          <Field label="Доставка, ₽">
            <input
              type="number"
              min={0}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900"
            />
          </Field>
        </div>

        <Field label="Бесплатная доставка от, ₽ (пусто = нет)">
          <input
            type="number"
            min={0}
            value={freeFromRaw}
            onChange={(e) => setFreeFromRaw(e.target.value)}
            placeholder="например, 1500"
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="ETA min, мин">
            <input
              type="number"
              min={1}
              value={etaMin}
              onChange={(e) => setEtaMin(Number(e.target.value) || 1)}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900"
            />
          </Field>
          <Field label="ETA max, мин">
            <input
              type="number"
              min={1}
              value={etaMax}
              onChange={(e) => setEtaMax(Number(e.target.value) || 1)}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-ink-900">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Зона активна
        </label>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-1 rounded-2xl bg-brand-600 px-3 py-3 text-[14px] font-bold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        <Save size={14} />
        {pending ? "Сохраняем..." : "Сохранить зону"}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </div>
      {children}
    </label>
  );
}
