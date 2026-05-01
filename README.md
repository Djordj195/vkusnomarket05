# 🍅 ВКУСНОМАРКЕТ

> Доставка свежих продуктов с рынка, товаров из лавок и готовой еды по г. Кизляр и району.

Полноценное мобильное приложение в формате PWA (Progressive Web App): открывается с телефона, ставится на главный экран, работает офлайн, поддерживает push-уведомления.

## ✨ Что внутри

- 🛍 **Каталог** на главном экране, переключатель «Рынок / Лавки / Готовая еда»
- 🔍 Поиск по товарам, категории и подкатегории
- ❤️ Избранные товары
- 🛒 Корзина с подсчётом и минимальным заказом 500 ₽
- 📱 Оформление заказа: имя, телефон, адрес, комментарий, оплата, геолокация
- 📦 Заказы со статусами: Принят → Готовится → Передан курьеру → Доставлен
- 📞 Номер курьера показывается клиенту, когда заказ передан
- 🔐 Вход по номеру телефона (демо-код `1234`, далее SMS.ru)
- 🛠 **Админ-панель** с отдельным входом: товары, категории, магазины/лавки, заказы, курьеры
- 🤖 Уведомления администратору в Telegram о каждом новом заказе
- 🌿 Дизайн: зелёный + белый + оранжевые акценты, крупные карточки, нижнее меню

## 🧰 Технологии

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- TypeScript, [Tailwind CSS 4](https://tailwindcss.com/), [Zustand](https://github.com/pmndrs/zustand)
- [lucide-react](https://lucide.dev/) — иконки
- PWA-манифест и стандартные иконки 192/512/maskable
- Telegram Bot API для уведомлений

## 🚀 Запуск локально (для разработки)

```bash
npm install
cp .env.example .env.local   # заполните переменные позже
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Админ-панель: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
По умолчанию `admin` / `vkusno2025` (поменяйте через `ADMIN_LOGIN` / `ADMIN_PASSWORD`).

## 📦 Сборка и деплой

```bash
npm run build
npm run start
```

Рекомендуемый хостинг: [Vercel](https://vercel.com/) (одна кнопка из GitHub).

## 🔌 Интеграции

См. [`SETUP.md`](./SETUP.md) — пошаговая инструкция (с телефона) по подключению:

1. **Vercel** — деплой и автообновление с GitHub.
2. **Telegram-бот** — уведомления о заказах.
3. **SMS.ru** — отправка SMS-кодов на телефон при входе.
4. **Яндекс.Карты** — геолокация и карта в заказе.
5. **Supabase** — база данных (товары, заказы, пользователи).
6. **ЮKassa** — оплата картой.

## 🗂 Структура проекта

```
src/
  app/                     # Маршруты (App Router)
    admin/                 # Админ-панель с отдельным входом
      (dashboard)/         # Защищённые страницы админки
      login/               # Логин админа
    api/                   # API-эндпоинты (например, статус заказа)
    auth/                  # Вход клиента по номеру телефона
    cart/                  # Корзина
    category/[slug]/       # Страница категории
    checkout/              # Оформление заказа
    favorites/             # Избранное клиента
    orders/                # Список заказов и детальная страница
    product/[slug]/        # Карточка товара
    profile/               # Профиль клиента
    search/                # Поиск
    support/               # Поддержка (WhatsApp, Telegram, телефон)
    page.tsx               # Главный экран (каталог)
    layout.tsx             # Корневой layout с нижним меню
  components/
    catalog/               # ProductCard, CategoryGrid, SearchBar, SourceTabs, WeeklyBanner
    layout/                # Header, BottomNav, PageShell, Logo
    ui/                    # Button, Input, Badge, EmptyState
  data/                    # Демо-данные: products.ts, categories.ts, shops.ts
  lib/                     # constants.ts, types.ts, utils.ts, use-mounted.ts
  server/                  # Server-only код (хранилища, server actions, telegram, admin auth)
  store/                   # Zustand-сторы клиента: cart, favorites, auth, orders
public/                    # Иконки PWA, og-image
scripts/
  generate-icons.mjs       # Скрипт пере-генерации PWA-иконок из SVG
```

## 🧪 Полезные команды

| Команда            | Что делает                          |
|--------------------|-------------------------------------|
| `npm run dev`      | Локальный dev-сервер на 3000        |
| `npm run build`    | Production-сборка                   |
| `npm run start`    | Запуск собранной версии             |
| `npm run lint`     | Проверка кода ESLint                |
| `node scripts/generate-icons.mjs` | Пересборка PWA-иконок |

## 🛟 Поддержка

Контакты WhatsApp/Telegram/телефон администратора заполняются в файле
[`src/lib/constants.ts`](./src/lib/constants.ts) в объекте `DEFAULT_CONTACTS`.

---

Сделано с заботой 🌿 для Кизляра.
