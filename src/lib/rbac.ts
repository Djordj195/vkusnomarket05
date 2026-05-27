// Phase 6: RBAC матрица. Файл — единственный источник правды по
// тому, какие разрешения у каких ролей. Используется и в UI
// (страница `/admin/roles`), и на бэке через guard-функцию
// `requirePermission` из `src/server/rbac.ts`.

export type Role =
  | "super_admin"
  | "support"
  | "vendor_owner"
  | "vendor_manager"
  | "vendor_operator"
  | "vendor_picker"
  | "courier_platform"
  | "courier_shop"
  | "client";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Супер-админ",
  support: "Поддержка",
  vendor_owner: "Владелец продавца",
  vendor_manager: "Менеджер продавца",
  vendor_operator: "Оператор заказов",
  vendor_picker: "Сборщик",
  courier_platform: "Курьер платформы",
  courier_shop: "Курьер магазина",
  client: "Клиент",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Полный доступ ко всем сущностям платформы",
  support: "Тикеты, маскированный просмотр заказов, ответы клиентам",
  vendor_owner: "Управление витриной, каталогом, сотрудниками и финансами",
  vendor_manager: "Каталог, заказы, аналитика своего продавца",
  vendor_operator: "Принимает заказы и меняет их статусы",
  vendor_picker: "Только сборка заказов",
  courier_platform: "Заказы от любого продавца платформы",
  courier_shop: "Заказы только своего магазина",
  client: "Заказы, отзывы, профиль",
};

// Группы permissions — для удобной отрисовки матрицы.
export const PERMISSION_GROUPS = [
  "vendors",
  "products",
  "orders",
  "couriers",
  "cities",
  "zones",
  "tariffs",
  "support",
  "users",
  "legal",
  "audit",
  "system",
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export type Permission = {
  key: string;
  group: PermissionGroup;
  label: string;
};

// Полный список разрешений. Соглашение: <группа>:<действие>.
export const PERMISSIONS: Permission[] = [
  // vendors
  { key: "vendors:read",     group: "vendors", label: "Просмотр продавцов" },
  { key: "vendors:moderate", group: "vendors", label: "Модерация (одобрить / приостановить / заблокировать)" },
  { key: "vendors:feature",  group: "vendors", label: "Поднять в TOP" },
  { key: "vendors:edit_storefront", group: "vendors", label: "Редактирование витрины" },
  { key: "vendors:edit_requisites", group: "vendors", label: "Редактирование реквизитов и документов" },
  { key: "vendors:invite_staff",    group: "vendors", label: "Приглашение сотрудников" },

  // products
  { key: "products:read",   group: "products", label: "Просмотр каталога" },
  { key: "products:create", group: "products", label: "Создание товара" },
  { key: "products:update", group: "products", label: "Изменение товара" },
  { key: "products:delete", group: "products", label: "Удаление товара" },

  // orders
  { key: "orders:read_all",     group: "orders", label: "Просмотр всех заказов" },
  { key: "orders:read_vendor",  group: "orders", label: "Просмотр заказов своего продавца" },
  { key: "orders:read_courier", group: "orders", label: "Просмотр заказов курьера" },
  { key: "orders:accept",       group: "orders", label: "Подтверждение приёма заказа" },
  { key: "orders:change_status", group: "orders", label: "Смена статуса заказа" },
  { key: "orders:assign_courier", group: "orders", label: "Назначение курьера" },
  { key: "orders:cancel",       group: "orders", label: "Отмена заказа" },

  // couriers
  { key: "couriers:read",     group: "couriers", label: "Просмотр курьеров" },
  { key: "couriers:create",   group: "couriers", label: "Добавление курьеров" },
  { key: "couriers:update",   group: "couriers", label: "Изменение курьеров" },
  { key: "couriers:moderate", group: "couriers", label: "Активация / блокировка курьеров" },

  // cities
  { key: "cities:read",  group: "cities", label: "Просмотр городов" },
  { key: "cities:edit",  group: "cities", label: "Активация / выключение города" },

  // zones
  { key: "zones:read",   group: "zones", label: "Просмотр зон доставки" },
  { key: "zones:edit",   group: "zones", label: "Редактирование зон (полигоны, тарифы)" },

  // tariffs
  { key: "tariffs:read", group: "tariffs", label: "Просмотр тарифов и комиссий" },
  { key: "tariffs:edit", group: "tariffs", label: "Изменение тарифов и комиссий" },

  // support
  { key: "support:read",   group: "support", label: "Просмотр тикетов" },
  { key: "support:reply",  group: "support", label: "Ответы в тикетах" },
  { key: "support:escalate", group: "support", label: "Эскалация / закрытие тикетов" },

  // users
  { key: "users:read",   group: "users", label: "Просмотр пользователей" },
  { key: "users:moderate", group: "users", label: "Блокировка / разблокировка пользователей" },

  // legal
  { key: "legal:read",   group: "legal", label: "Просмотр юр.документов" },
  { key: "legal:publish", group: "legal", label: "Публикация новых редакций документов" },

  // audit
  { key: "audit:read", group: "audit", label: "Просмотр audit-логов" },

  // system
  { key: "system:rbac",   group: "system", label: "Управление ролями и правами" },
  { key: "system:settings", group: "system", label: "Глобальные настройки платформы" },
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key) as readonly string[];
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

const ROLES: Role[] = [
  "super_admin",
  "support",
  "vendor_owner",
  "vendor_manager",
  "vendor_operator",
  "vendor_picker",
  "courier_platform",
  "courier_shop",
  "client",
];

const all = (): PermissionKey[] =>
  PERMISSIONS.map((p) => p.key as PermissionKey);

// Матрица: какие permissions у какой роли.
export const ROLE_PERMISSIONS: Record<Role, readonly PermissionKey[]> = {
  super_admin: all(),

  support: [
    "vendors:read",
    "products:read",
    "orders:read_all",
    "orders:cancel",
    "couriers:read",
    "users:read",
    "users:moderate",
    "support:read",
    "support:reply",
    "support:escalate",
    "legal:read",
    "audit:read",
  ],

  vendor_owner: [
    "vendors:read",
    "vendors:edit_storefront",
    "vendors:edit_requisites",
    "vendors:invite_staff",
    "products:read",
    "products:create",
    "products:update",
    "products:delete",
    "orders:read_vendor",
    "orders:accept",
    "orders:change_status",
    "orders:assign_courier",
    "orders:cancel",
    "couriers:read",
    "couriers:create",
    "couriers:update",
    "couriers:moderate",
    "zones:read",
    "zones:edit",
    "tariffs:read",
    "support:read",
    "support:reply",
    "legal:read",
  ],

  vendor_manager: [
    "vendors:read",
    "vendors:edit_storefront",
    "products:read",
    "products:create",
    "products:update",
    "products:delete",
    "orders:read_vendor",
    "orders:accept",
    "orders:change_status",
    "orders:assign_courier",
    "couriers:read",
    "zones:read",
    "tariffs:read",
    "support:read",
    "support:reply",
    "legal:read",
  ],

  vendor_operator: [
    "products:read",
    "orders:read_vendor",
    "orders:accept",
    "orders:change_status",
    "orders:assign_courier",
    "couriers:read",
    "support:read",
  ],

  vendor_picker: [
    "products:read",
    "orders:read_vendor",
    "orders:change_status",
  ],

  courier_platform: [
    "orders:read_courier",
    "orders:change_status",
  ],

  courier_shop: [
    "orders:read_courier",
    "orders:change_status",
  ],

  client: [
    "products:read",
    "legal:read",
    "support:read",
  ],
};

export function rolePermissionCount(role: Role): number {
  return ROLE_PERMISSIONS[role].length;
}

export function hasPermission(
  role: Role | null | undefined,
  perm: PermissionKey
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(perm);
}

export function allRoles(): Role[] {
  return ROLES;
}
