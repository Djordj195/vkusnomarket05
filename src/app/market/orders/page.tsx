import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { OrdersView } from "./OrdersView";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <Header variant="page" title="Заказы" showBack={false} />
        </PageShell>
      }
    >
      <OrdersView />
    </Suspense>
  );
}
