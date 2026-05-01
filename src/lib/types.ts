export type SourceType = "market" | "shop" | "food";

export const SOURCE_LABELS: Record<SourceType, string> = {
  market: "Продукты с рынка",
  shop: "Лавки",
  food: "Готовая еда",
};

export const SOURCE_SHORT_LABELS: Record<SourceType, string> = {
  market: "Рынок",
  shop: "Лавки",
  food: "Готовая еда",
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  source: SourceType;
  icon: string;
  emoji: string;
  itemsCount: number;
  highlight?: boolean;
};

export type Shop = {
  id: string;
  slug: string;
  name: string;
  source: SourceType;
  description?: string;
  cover?: string;
  rating?: number;
  isOpen?: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  source: SourceType;
  categoryId: string;
  shopId?: string;
  price: number;
  oldPrice?: number;
  unit: string;
  image: string;
  description: string;
  inStock: boolean;
  weight?: string;
  isWeekly?: boolean;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type OrderStatus =
  | "accepted"
  | "preparing"
  | "courier"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  accepted: "Принят",
  preparing: "Готовится",
  courier: "Передан курьеру",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "accepted",
  "preparing",
  "courier",
  "delivered",
];

export type PaymentMethod = "cash" | "card";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Наличными курьеру",
  card: "Картой (скоро)",
};

export type Courier = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
};

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  address: string;
  comment?: string;
  geo?: { lat: number; lng: number };
  payment: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  courierId?: string;
};

export type User = {
  id: string;
  phone: string;
  name?: string;
};
