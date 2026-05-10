import { HomeView } from "./HomeView";
import { listCategories } from "@/server/categories-store";
import { listShops } from "@/server/shops-store";
import { listProducts } from "@/server/products-store";
import {
  countApprovedFeedback,
  listApprovedFeedback,
} from "@/server/feedback-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, shops, products, approvedFeedback, approvedFeedbackTotal] =
    await Promise.all([
      listCategories(),
      listShops(),
      listProducts(),
      listApprovedFeedback(3),
      countApprovedFeedback(),
    ]);
  return (
    <HomeView
      categories={categories}
      shops={shops}
      products={products}
      approvedFeedback={approvedFeedback}
      approvedFeedbackTotal={approvedFeedbackTotal}
    />
  );
}
