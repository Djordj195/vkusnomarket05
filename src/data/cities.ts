import type { City } from "@/lib/types";

// Статический сид городов — fallback на случай, если Supabase ещё не
// сконфигурирован или миграция 0005_multitenant_core.sql ещё не применена.
// Боевые данные живут в таблице public.cities — этот массив используется
// только когда БД недоступна. Держим в синхроне с миграцией.

export const CITIES: City[] = [
  {
    id: "city-kizlyar",
    slug: "kizlyar",
    name: "Кизляр",
    region: "Республика Дагестан",
    regionType: "Республика",
    federalDistrict: "Северо-Кавказский",
    timezone: "Europe/Moscow",
    lat: 43.8467,
    lng: 46.7117,
    population: 49000,
    status: "active",
    sortOrder: 1,
  },
  {
    id: "city-makhachkala",
    slug: "makhachkala",
    name: "Махачкала",
    region: "Республика Дагестан",
    regionType: "Республика",
    federalDistrict: "Северо-Кавказский",
    timezone: "Europe/Moscow",
    lat: 42.9849,
    lng: 47.5047,
    population: 601000,
    status: "coming_soon",
    sortOrder: 2,
  },
  {
    id: "city-derbent",
    slug: "derbent",
    name: "Дербент",
    region: "Республика Дагестан",
    regionType: "Республика",
    federalDistrict: "Северо-Кавказский",
    timezone: "Europe/Moscow",
    lat: 42.0577,
    lng: 48.298,
    population: 126000,
    status: "coming_soon",
    sortOrder: 3,
  },
  {
    id: "city-khasavyurt",
    slug: "khasavyurt",
    name: "Хасавюрт",
    region: "Республика Дагестан",
    regionType: "Республика",
    federalDistrict: "Северо-Кавказский",
    timezone: "Europe/Moscow",
    lat: 43.2486,
    lng: 46.5876,
    population: 151000,
    status: "coming_soon",
    sortOrder: 4,
  },
];

export const DEFAULT_CITY_ID = "city-kizlyar";
