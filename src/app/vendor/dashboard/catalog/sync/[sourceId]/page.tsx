import { getCurrentVendor } from "@/server/vendor-auth";
import { redirect } from "next/navigation";
import { getSource, listJobs } from "@/server/catalog-sync-store";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { SourceDetail } from "./SourceDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ sourceId: string }> };

export default async function SourceDetailPage({ params }: Props) {
  const { sourceId } = await params;
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vendor/login");

  const source = await getSource(sourceId, vendor.id);
  if (!source) redirect("/vendor/dashboard/catalog/sync");

  const jobs = await listJobs(sourceId, vendor.id, 10);

  return (
    <div className="space-y-4">
      <SubpageHeader title={source.name || "Источник"} />
      <SourceDetail source={source} jobs={jobs} />
    </div>
  );
}
