import type { Order } from "./types";

/** Сводка по продавцу, прикладываемая к заказу для UI курьера. */
export type CourierVendorInfo = {
  id: string;
  brandName: string;
  slug: string;
  phone: string | null;
  logoUrl: string | null;
};

/** Точка забора заказа: координаты + человеко-читаемый лейбл (обычно город). */
export type CourierPickupPoint = {
  lat: number;
  lng: number;
  label: string;
};

/** Полный пакет данных по одному заказу для курьерского интерфейса. */
export type CourierOrderItem = {
  order: Order;
  vendor: CourierVendorInfo | null;
  pickup: CourierPickupPoint | null;
};
