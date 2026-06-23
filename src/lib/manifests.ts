export type AppRole = "client" | "vendor" | "courier" | "admin";

type ManifestConfig = {
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  scope: string;
  id: string;
  themeColor: string;
  backgroundColor: string;
  iconPrefix: string;
};

const CONFIGS: Record<AppRole, ManifestConfig> = {
  client: {
    name: "ВкусМаркет — Всё что вы любите. Быстро. Рядом.",
    shortName: "ВкусМаркет",
    description: "Доставка продуктов и готовой еды по всей России.",
    startUrl: "/",
    scope: "/",
    id: "/",
    themeColor: "#6f46ff",
    backgroundColor: "#ffffff",
    iconPrefix: "icon",
  },
  vendor: {
    name: "ВкусМаркет Продавец",
    shortName: "ВМ Продавец",
    description: "Кабинет продавца ВкусМаркет — управление товарами, заказами и доставкой.",
    startUrl: "/vendor/dashboard",
    scope: "/vendor/",
    id: "/vendor",
    themeColor: "#16a34a",
    backgroundColor: "#ffffff",
    iconPrefix: "icon-vendor",
  },
  courier: {
    name: "ВкусМаркет Курьер",
    shortName: "ВМ Курьер",
    description: "Кабинет курьера ВкусМаркет — активные заказы, маршруты и история доставок.",
    startUrl: "/courier/dashboard",
    scope: "/courier/",
    id: "/courier",
    themeColor: "#ea580c",
    backgroundColor: "#ffffff",
    iconPrefix: "icon-courier",
  },
  admin: {
    name: "ВкусМаркет Админ",
    shortName: "ВМ Админ",
    description: "Панель управления ВкусМаркет — продавцы, заказы, каталог, аналитика.",
    startUrl: "/admin",
    scope: "/admin",
    id: "/admin",
    themeColor: "#dc2626",
    backgroundColor: "#ffffff",
    iconPrefix: "icon-admin",
  },
};

export function buildManifest(role: AppRole) {
  const c = CONFIGS[role];
  return {
    name: c.name,
    short_name: c.shortName,
    description: c.description,
    start_url: c.startUrl,
    id: c.id,
    scope: c.scope,
    display: "standalone" as const,
    orientation: "portrait" as const,
    background_color: c.backgroundColor,
    theme_color: c.themeColor,
    lang: "ru",
    categories: ["food", "shopping"],
    icons: [
      { src: `/${c.iconPrefix}-192.png`, sizes: "192x192", type: "image/png" },
      { src: `/${c.iconPrefix}-512.png`, sizes: "512x512", type: "image/png" },
      {
        src: `/${c.iconPrefix}-maskable.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable" as const,
      },
    ],
  };
}

export function getThemeColor(role: AppRole): string {
  return CONFIGS[role].themeColor;
}

export function getIconPrefix(role: AppRole): string {
  return CONFIGS[role].iconPrefix;
}
