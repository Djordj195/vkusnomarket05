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

// Платформенные вертикали (Phase 1+). Каждый продавец работает в одной
// из четырёх вертикалей — это определяет вкладку на главной у клиента.
export type Vertical = "food" | "grocery" | "pharmacy" | "chemistry";

export const VERTICAL_LABELS: Record<Vertical, string> = {
  food: "Готовая еда",
  grocery: "Продукты",
  pharmacy: "Аптека",
  chemistry: "Бытовая химия",
};

export const VERTICAL_SHORT_LABELS: Record<Vertical, string> = {
  food: "Еда",
  grocery: "Продукты",
  pharmacy: "Аптека",
  chemistry: "Дом",
};

export const VERTICAL_EMOJIS: Record<Vertical, string> = {
  food: "🍱",
  grocery: "🛒",
  pharmacy: "💊",
  chemistry: "🧴",
};

// Город платформы (Phase 1).
export type CityStatus = "active" | "coming_soon" | "disabled";

export type City = {
  id: string;
  slug: string;
  name: string;
  region: string;
  regionType: string;
  federalDistrict: string;
  timezone: string;
  lat: number;
  lng: number;
  population?: number;
  status: CityStatus;
  sortOrder: number;
};

// Продавец платформы (Phase 1).
export type VendorStatus =
  | "draft"
  | "pending"
  | "approved"
  | "suspended"
  | "blocked";

export type LegalEntityType = "IP" | "OOO" | "SAMOZ" | "NONE";

export type VendorContacts = {
  phone?: string;
  email?: string;
  telegram?: string;
  whatsapp?: string;
};

export type Vendor = {
  id: string;
  slug: string;
  brandName: string;
  verticalPrimary: Vertical;
  verticals: Vertical[];
  cityId: string;
  ownerUserId?: string;
  status: VendorStatus;
  logoUrl?: string;
  bannerUrl?: string;
  shortDescription?: string;
  description?: string;
  legalEntityType?: LegalEntityType;
  legalName?: string;
  inn?: string;
  contacts: VendorContacts;
  ratingAvg: number;
  ratingCount: number;
  featured: boolean;
  subscriptionTier: "free" | "basic" | "premium";
  sortOrder: number;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  source: SourceType;
  icon: string;
  emoji: string;
  image?: string;
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
  // Phase 1: продавец и вертикаль (необязательны для статического fallback)
  vendorId?: string;
  vertical?: Vertical;
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

// Тип доставки заказа. Phase 4 — добавили самовывоз.
export type DeliveryKind = "delivery" | "pickup";

export const DELIVERY_KIND_LABELS: Record<DeliveryKind, string> = {
  delivery: "Доставка курьером",
  pickup: "Самовывоз",
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
  // Phase 4: продавец, тип доставки, желаемое время и группа multi-vendor чек-аута.
  // Все поля опциональны — старые записи (до миграции 0008) их не имеют.
  vendorId?: string;
  deliveryKind?: DeliveryKind;
  desiredAt?: string;
  checkoutGroupId?: string;
};

export type User = {
  id: string;
  phone: string;
  name?: string;
};
