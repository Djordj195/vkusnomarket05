// Phase 6: типы и helpers для audit-логов. Чистый клиентский слой,
// никаких импортов из @/server — иначе client-bundle подцепит "server-only".

export type AuditActorType =
  | "admin"
  | "vendor"
  | "courier"
  | "system"
  | "client";

export type AuditEntry = {
  id: string;
  actorType: AuditActorType;
  actorId: string | null;
  actorLabel: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export const AUDIT_ACTOR_LABELS: Record<AuditActorType, string> = {
  admin: "Админ",
  vendor: "Продавец",
  courier: "Курьер",
  system: "Система",
  client: "Клиент",
};

// Список самых частых action-кодов — для подсветки в UI.
// (Новые коды можно использовать без правки этого списка.)
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "vendor.status_change": "Смена статуса продавца",
  "vendor.feature_toggle": "Поднятие/снятие из TOP",
  "vendor.application_submit": "Заявка продавца на подключение",
  "city.status_change": "Смена статуса города",
  "order.status_change": "Смена статуса заказа",
  "order.assign_courier": "Назначение курьера",
  "order.courier_stage": "Курьер сменил саб-статус",
  "zone.create": "Создание зоны доставки",
  "zone.update": "Изменение зоны доставки",
  "zone.delete": "Удаление зоны доставки",
  "courier.create": "Создание курьера",
  "courier.update": "Изменение курьера",
  "courier.delete": "Удаление курьера",
  "feedback.resolve": "Закрытие обратной связи",
  "admin.login": "Вход админа",
  "admin.logout": "Выход админа",
};

export function actionLabel(code: string): string {
  return AUDIT_ACTION_LABELS[code] ?? code;
}
