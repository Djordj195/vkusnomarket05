export const APP_NAME = "ВкусМаркет";
export const APP_TAGLINE = "Всё что вы любите. Быстро. Рядом.";
export const CITY_NAME = "Кизляр";

// Минимальной суммы заказа нет — клиент может заказать на любую сумму.
export const DELIVERY_FEE = 150;

// Контакты Оператора — синхронизированы с /src/data/legal.ts (COMPANY).
// Эти значения используются по умолчанию, если в админке ничего не задано.
export const DEFAULT_CONTACTS = {
  whatsapp: "+79375021100",
  telegram: "@vkusnomarket05_bot",
  phone: "+79375021100",
  email: "vkusmarket05@list.ru",
};

export const ADMIN_DEFAULT_LOGIN = "admin";
// Пароль админки берётся из переменной окружения ADMIN_PASSWORD,
// иначе используется значение ниже (поменяйте перед запуском в продакшн).
export const ADMIN_DEFAULT_PASSWORD = "vkusno2025";

// Демо-режим: код подтверждения по СМС всегда 123456, пока не подключим SMS-провайдер
export const DEMO_SMS_CODE = "123456";
