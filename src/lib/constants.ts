export const APP_NAME = "ВКУСНОМАРКЕТ";
export const APP_TAGLINE = "Доставка по Кизляру и району";
export const CITY_NAME = "Кизляр";

export const MIN_ORDER_AMOUNT = 500;
export const DELIVERY_FEE = 150;

// Контакты — заполните позже в админке или здесь напрямую.
// Эти значения используются по умолчанию, если в админке ничего не задано.
export const DEFAULT_CONTACTS = {
  whatsapp: "+79375021100", // Например: "+79280000000"
  telegram: "@vkusnomarket05_bot", // Например: "@vkusnomarket"
  phone: "+79375021100", // Например: "+78720000000"
  email: "",
};

export const ADMIN_DEFAULT_LOGIN = "admin";
// Пароль админки берётся из переменной окружения ADMIN_PASSWORD,
// иначе используется значение ниже (поменяйте перед запуском в продакшн).
export const ADMIN_DEFAULT_PASSWORD = "vkusno2025";

// Демо-режим: код подтверждения по СМС всегда 1234, пока не подключим SMS.ru
export const DEMO_SMS_CODE = "1234";
