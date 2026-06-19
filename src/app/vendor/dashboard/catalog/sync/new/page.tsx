import { getCurrentVendor } from "@/server/vendor-auth";
import { redirect } from "next/navigation";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { NewSourceWizard } from "./NewSourceWizard";

export const dynamic = "force-dynamic";

export default async function NewSourcePage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vendor/login");

  return (
    <div className="space-y-4">
      <SubpageHeader title="Подключить каталог" />
      <NewSourceWizard />
    </div>
  );
}
