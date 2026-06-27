import { PageShell } from "@/components/layout/PageShell";
import { Header } from "@/components/layout/Header";
import { TicketDetailView } from "./TicketDetailView";

export const metadata = {
  title: "Обращение · ВкусМаркет",
};

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell className="bg-white">
      <Header variant="page" title="Обращение" showBack />
      <TicketDetailView ticketId={id} />
    </PageShell>
  );
}
