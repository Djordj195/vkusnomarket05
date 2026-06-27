import { PageShell } from "@/components/layout/PageShell";
import { Header } from "@/components/layout/Header";
import { NewTicketForm } from "./NewTicketForm";

export const metadata = {
  title: "Новое обращение · ВкусМаркет",
};

export const dynamic = "force-dynamic";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const sp = await searchParams;
  return (
    <PageShell className="bg-white">
      <Header variant="page" title="Новое обращение" showBack />
      <NewTicketForm orderId={sp.order ?? null} />
    </PageShell>
  );
}
