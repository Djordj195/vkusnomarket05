import { notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/server/admin-auth";
import { getTicketById, listTicketMessages } from "@/server/tickets/tickets-store";
import { AdminTicketDetailView } from "./AdminTicketDetailView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Тикет · Админ",
};

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await isAdminAuthenticated())) {
    notFound();
  }
  const ticket = await getTicketById(id);
  if (!ticket) {
    notFound();
  }
  const messages = await listTicketMessages(id, { includeInternal: true });
  return <AdminTicketDetailView ticket={ticket} initialMessages={messages} />;
}
