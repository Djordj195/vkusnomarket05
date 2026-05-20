import { getCurrentVendor } from "@/server/vendor-auth";
import { SubpageHeader } from "@/components/vendor/PlaceholderCard";
import { StorefrontEditor } from "./StorefrontEditor";

export default async function VendorStorefrontPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  return (
    <div className="space-y-4">
      <SubpageHeader title="Витрина" />
      <p className="text-[13px] text-ink-500">
        Здесь вы управляете тем, как клиенты видят ваш магазин в каталоге
        ВкусМаркета.
      </p>

      <StorefrontEditor
        initial={{
          brandName: vendor.brandName,
          shortDescription: vendor.shortDescription ?? "",
          description: vendor.description ?? "",
          logoUrl: vendor.logoUrl ?? "",
          bannerUrl: vendor.bannerUrl ?? "",
        }}
      />
    </div>
  );
}
