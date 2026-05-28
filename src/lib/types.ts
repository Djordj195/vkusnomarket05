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
  card: "Картой онлайн (ЮKassa)",
};

// Тип доставки заказа. Phase 4 — добавили самовывоз.
export type DeliveryKind = "delivery" | "pickup";

export const DELIVERY_KIND_LABELS: Record<DeliveryKind, string> = {
  delivery: "Доставка курьером",
  pickup: "Самовывоз",
};

// Phase 5: sub-status, отчитываемый курьером пока заказ в макро-статусе
// "courier". Опционален: старые заказы без этого поля рендерятся как
// "Передан курьеру" в обычной шкале статусов.
export type CourierStage =
  | "dispatching"
  | "arrived_pickup"
  | "picked_up"
  | "in_transit"
  | "arrived_dropoff"
  | "completed"
  | "failed";

export const COURIER_STAGE_LABELS: Record<CourierStage, string> = {
  dispatching: "Направляюсь в магазин",
  arrived_pickup: "Прибыл в магазин",
  picked_up: "Забрал заказ",
  in_transit: "В пути к клиенту",
  arrived_dropoff: "Прибыл к клиенту",
  completed: "Доставлено",
  failed: "Не удалось доставить",
};

// Порядок шагов курьера. completed/failed — терминальные, не часть
// последовательности и должны вызываться отдельно из UI.
export const COURIER_STAGE_FLOW: CourierStage[] = [
  "dispatching",
  "arrived_pickup",
  "picked_up",
  "in_transit",
  "arrived_dropoff",
  "completed",
];

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
  // Phase 5: курьерский саб-статус (см. CourierStage).
  courierStage?: CourierStage;
  // Phase 8: ссылка на платёж и зеркало его статуса.
  paymentId?: string;
  paymentStatus?: PaymentStatus;
};

// Phase 8: ЮKassa-платёж — покрывает все split-orders одного checkout-group.
export type PaymentStatus =
  | "pending"
  | "waiting_for_capture"
  | "succeeded"
  | "canceled"
  | "refunded"
  | "partially_refunded";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Ожидает оплаты",
  waiting_for_capture: "Подтверждается",
  succeeded: "Оплачен",
  canceled: "Отменён",
  refunded: "Возврат",
  partially_refunded: "Частичный возврат",
};

export type PaymentProvider = "yookassa" | "cash" | "manual";

export type PaymentRefund = {
  id: string;
  amountKop: number;
  reason: string | null;
  createdAt: string;
};

export type Payment = {
  id: string;
  checkoutGroupId: string;
  amountKop: number;
  currency: string;
  provider: PaymentProvider;
  providerPaymentId: string | null;
  status: PaymentStatus;
  idempotencyKey: string | null;
  confirmationUrl: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  receipt: PaymentReceipt | null;
  refundedKop: number;
  refunds: PaymentRefund[];
  createdAt: string;
  updatedAt: string;
};

// 54-ФЗ чек: каждый item должен содержать описание, цену, количество,
// налог и предмет расчёта. Мы храним полный чек и в наш store, и
// отправляем его в ЮKassa, которая, в свою очередь, передаёт его в
// ОФД (оператор фискальных данных) — это закрывает обязательство по 54-ФЗ.
export type PaymentReceiptItem = {
  description: string;
  quantity: number;
  amountKop: number; // цена за единицу
  vatCode: 1 | 2 | 3 | 4 | 5 | 6; // ЮKassa: 1=без НДС, 2=0%, 3=10%, 4=20%, 5=10/110, 6=20/120
  paymentMode: "full_payment" | "full_prepayment" | "advance";
  paymentSubject: "commodity" | "service" | "another";
};

export type PaymentReceipt = {
  customer: { phone?: string; email?: string };
  items: PaymentReceiptItem[];
};

export type User = {
  id: string;
  phone: string;
  name?: string;
};

// Phase 6: зона доставки продавца. polygon — массив точек {lat, lng};
// внутри Supabase сохраняется как GeoJSON-совместимый JSON (см. миграцию
// 0005, поле `polygon jsonb`). Полигон должен быть замкнут логически —
// первая точка повторяется в конце автоматически на стороне сервера.
export type DeliveryZonePoint = { lat: number; lng: number };

// Phase 9: уведомления.
export type NotificationRecipientType = "client" | "vendor" | "courier" | "admin";
export type NotificationChannel = "push" | "email" | "sms";
export type NotificationEvent =
  | "order.new"
  | "order.status"
  | "order.assigned_courier"
  | "payment.succeeded"
  | "payment.refunded";

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEvent, string> = {
  "order.new": "Новый заказ",
  "order.status": "Изменение статуса заказа",
  "order.assigned_courier": "Назначен курьер",
  "payment.succeeded": "Оплата прошла",
  "payment.refunded": "Возврат оформлен",
};

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: "Push",
  email: "E-mail",
  sms: "SMS",
};

export type StoredPushSubscription = {
  id: string;
  recipientType: NotificationRecipientType;
  recipientId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  enabled: boolean;
  createdAt: string;
  lastSeenAt: string;
};

export type NotificationPreference = {
  id: string;
  recipientType: NotificationRecipientType;
  recipientId: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  enabled: boolean;
  updatedAt: string;
};

export type NotificationLogStatus = "queued" | "sent" | "failed" | "skipped";

export type NotificationLogEntry = {
  id: string;
  recipientType: NotificationRecipientType;
  recipientId: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  status: NotificationLogStatus;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
};

export type DeliveryZone = {
  id: string;
  vendorId: string;
  name: string;
  polygon: DeliveryZonePoint[];
  minOrder: number;
  deliveryFee: number;
  // null = бесплатной доставки не предусмотрено
  freeFrom: number | null;
  etaMin: number;
  etaMax: number;
  isActive: boolean;
  createdAt: string;
};
