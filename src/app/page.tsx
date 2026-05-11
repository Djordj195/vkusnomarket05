import { HomeView } from "./HomeView";
import { listCategories } from "@/server/categories-store";
import { listShops } from "@/server/shops-store";
import { listProducts } from "@/server/products-store";
import {
  countApprovedFeedback,
  listApprovedFeedback,
} from "@/server/feedback-store";
import { listCities } from "@/server/cities-store";
import { getCurrentCity } from "@/server/current-city";
import { listVendors } from "@/server/vendors-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    categories,
    shops,
    products,
    approvedFeedback,
    approvedFeedbackTotal,
    currentCity,
    cities,
  ] = await Promise.all([
    listCategories(),
    listShops(),
    listProducts(),
    listApprovedFeedback(3),
    countApprovedFeedback(),
    getCurrentCity(),
    listCities(),
  ]);

  // Phase 1/2: продавцы есть только в активных городах. В остальных
  // главная показывает заглушку «скоро откроемся».
  const isActiveCity = currentCity.status === "active";
  const cityProducts = isActiveCity ? products : [];
  const cityCategories = isActiveCity ? categories : [];
  const cityShops = isActiveCity ? shops : [];

  // Phase 2: рейтинг продавцов в текущем городе (только approved).
  const cityVendors = isActiveCity
    ? await listVendors({ cityId: currentCity.id, status: "approved" })
    : [];
  const featuredVendors = cityVendors
    .slice()
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.ratingAvg !== b.ratingAvg) return b.ratingAvg - a.ratingAvg;
      return a.sortOrder - b.sortOrder;
    })
    .slice(0, 8);

  return (
    <HomeView
      categories={cityCategories}
      shops={cityShops}
      products={cityProducts}
      vendors={featuredVendors}
      approvedFeedback={approvedFeedback}
      approvedFeedbackTotal={approvedFeedbackTotal}
      currentCity={currentCity}
      cities={cities}
    />
  );
}
