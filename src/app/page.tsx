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

  // Phase 1: продавцы есть только в Кизляре. В остальных городах главная
  // показывает заглушку «скоро откроемся». В Phase 2 это сменится на
  // настоящую фильтрацию product/vendor → city.
  const isActiveCity = currentCity.status === "active";
  const cityProducts = isActiveCity ? products : [];
  const cityCategories = isActiveCity ? categories : [];
  const cityShops = isActiveCity ? shops : [];

  return (
    <HomeView
      categories={cityCategories}
      shops={cityShops}
      products={cityProducts}
      approvedFeedback={approvedFeedback}
      approvedFeedbackTotal={approvedFeedbackTotal}
      currentCity={currentCity}
      cities={cities}
    />
  );
}
