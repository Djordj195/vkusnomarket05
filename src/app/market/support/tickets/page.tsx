import { PageShell } from "@/components/layout/PageShell";
import { Header } from "@/components/layout/Header";
import { MyTicketsView } from "./MyTicketsView";

export const metadata = {
  title: "Мои обращения · ВкусМаркет",
};

export const dynamic = "force-dynamic";

export default function MyTicketsPage() {
  return (
    <PageShell className="bg-white">
      <Header variant="page" title="Мои обращения" showBack />
      <MyTicketsView />
    </PageShell>
  );
}
