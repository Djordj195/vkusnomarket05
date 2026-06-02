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

export type PaymentMethod = "cash" | "card" | "sbp";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Наличными курьеру",
  card: "Картой онлайн (ЮKassa)",
  sbp: "СБП (Система быстрых платежей)",
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

export type CourierType = "platform" | "shop";

export const COURIER_TYPE_LABELS: Record<CourierType, string> = {
  platform: "Курьер платформы",
  shop: "Курьер магазина",
};

export type Courier = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  courierType: CourierType;
  shopId?: string;
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
  // Phase 11: скидка по промокоду (рубли, ≥ 0), идентификатор и сам код.
  discountTotal?: number;
  promoCodeId?: string;
  promoCode?: string;
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
  | "payment.refunded"
  | "ticket.created"
  | "ticket.replied";

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEvent, string> = {
  "order.new": "Новый заказ",
  "order.status": "Изменение статуса заказа",
  "order.assigned_courier": "Назначен курьер",
  "payment.succeeded": "Оплата прошла",
  "payment.refunded": "Возврат оформлен",
  "ticket.created": "Новое обращение в поддержку",
  "ticket.replied": "Ответ в обращении",
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

// ─────────────────── Support tickets (Phase 10) ───────────────────

export type TicketRequesterType = "client" | "vendor" | "courier" | "guest";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_user"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type TicketCategory =
  | "order" // вопрос по конкретному заказу
  | "payment" // оплата, возврат, чек
  | "delivery" // курьер, адрес, время
  | "product" // качество товара, состав, срок
  | "account" // вход, привязка телефона, профиль
  | "vendor" // вопросы от продавцов
  | "courier" // вопросы от курьеров
  | "complaint" // жалоба на сервис/сотрудника
  | "suggestion" // предложение по улучшению
  | "other";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Открыт",
  in_progress: "В работе",
  waiting_user: "Ждём ответа",
  resolved: "Решён",
  closed: "Закрыт",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
  urgent: "Срочный",
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  order: "Заказ",
  payment: "Оплата",
  delivery: "Доставка",
  product: "Товар",
  account: "Аккаунт",
  vendor: "Продавец",
  courier: "Курьер",
  complaint: "Жалоба",
  suggestion: "Предложение",
  other: "Другое",
};

export type TicketAuthorType = "requester" | "support" | "system";

export type TicketMessage = {
  id: string;
  ticketId: string;
  authorType: TicketAuthorType;
  authorId: string | null;
  authorName: string | null;
  body: string;
  attachments: string[]; // URL-ы из Storage (PDF/JPG)
  isInternal: boolean; // внутренняя заметка, не видна клиенту
  createdAt: string;
};

export type Ticket = {
  id: string;
  number: string; // короткий номер для отображения, например T-0042
  requesterType: TicketRequesterType;
  requesterId: string | null; // user.phone / vendor.id / courier.id / null для гостя
  requesterName: string;
  requesterContact: string; // телефон или email
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  orderId: string | null; // привязка к заказу, если есть
  assigneeId: string | null; // оператор поддержки
  assigneeName: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadForUser: number; // непрочитанные клиентом
  unreadForSupport: number; // непрочитанные саппортом
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
};

// Phase 11: промокоды и купоны.
export type PromoCodeKind = "percent" | "fixed" | "free_shipping";

export const PROMO_CODE_KIND_LABELS: Record<PromoCodeKind, string> = {
  percent: "Процент",
  fixed: "Сумма",
  free_shipping: "Бесплатная доставка",
};

export type PromoCode = {
  id: string;
  code: string;
  description: string;
  kind: PromoCodeKind;
  /** Для percent — 1..100. Для fixed — сумма в рублях. Для free_shipping игнорируется. */
  value: number;
  /** Минимальная сумма подытога (без доставки), в рублях. 0 = без минимума. */
  minSubtotal: number;
  /** Максимальная сумма скидки (рубли). 0 = без потолка. */
  maxDiscount: number;
  validFrom: string | null;
  validUntil: string | null;
  /** Общий лимит использований. 0 = без лимита. */
  usageLimit: number;
  /** Лимит на одного клиента (по телефону). 0 = без лимита. */
  perUserLimit: number;
  vendorId: string | null;
  categoryId: string | null;
  active: boolean;
  usedCount: number;
  totalDiscount: number;
  createdAt: string;
  updatedAt: string;
};

export type PromoRedemption = {
  id: string;
  promoCodeId: string;
  promoCode: string;
  orderId: string | null;
  customerPhone: string;
  customerName: string | null;
  vendorId: string | null;
  discountAmount: number;
  subtotal: number;
  createdAt: string;
};

/** Расчёт скидки на конкретный split-order группы. */
export type PromoDiscountBreakdown = {
  vendorKey: string;
  subtotal: number;
  deliveryFee: number;
  discountSubtotal: number;
  discountShipping: number;
};

/** Итог валидации промокода для всего чек-аута (multi-vendor). */
export type PromoValidation =
  | {
      ok: true;
      promo: PromoCode;
      totalDiscount: number;
      breakdown: PromoDiscountBreakdown[];
    }
  | { ok: false; error: string };

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
