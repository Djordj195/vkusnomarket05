import { redirect } from "next/navigation";

// Keep a redirect alias so an old bookmark to /orders/history still works.
export default function CourierOrdersHistoryAlias() {
  redirect("/courier/dashboard/history");
}
