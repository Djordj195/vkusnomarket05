import type { Vendor } from "@/lib/types";

// Статический сид продавцов — fallback на случай, если Supabase ещё не
// сконфигурирован или миграция 0005_multitenant_core.sql ещё не применена.
// На проде продавцы живут в таблице public.vendors.

export const DEFAULT_VENDOR_ID = "vnd-vkusnomarket-kizlyar";

export const VENDORS: Vendor[] = [
  {
    id: DEFAULT_VENDOR_ID,
    slug: "vkusnomarket-kizlyar",
    brandName: "ВкусМаркет Кизляр",
    verticalPrimary: "food",
    verticals: ["food", "grocery"],
    cityId: "city-kizlyar",
    status: "approved",
    shortDescription:
      "Готовая еда, продукты с рынка и из лавок Кизляра",
    description:
      "Первый продавец платформы ВкусМаркет — собственный магазин с готовой едой, свежими овощами и фруктами с местного рынка, мясом, выпечкой и товарами с лавок.",
    contacts: {
      phone: "+79375021100",
      telegram: "@vkusnomarket05_bot",
      whatsapp: "+79375021100",
    },
    ratingAvg: 4.9,
    ratingCount: 50,
    featured: true,
    subscriptionTier: "free",
    sortOrder: 1,
  },
];
