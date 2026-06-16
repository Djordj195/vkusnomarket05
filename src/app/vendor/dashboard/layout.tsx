import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentVendor } from "@/server/vendor-auth";
import { vendorLogoutAction } from "@/server/vendor-login-actions";
import { AppManifestHead } from "@/components/pwa/AppManifestHead";
import { AppInstallBanner } from "@/components/pwa/AppInstallBanner";
import { VendorDashboardNav } from "./VendorDashboardNav";

export const dynamic = "force-dynamic";

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) {
    redirect("/vendor/login");
  }

  return (
    <div className="min-h-screen bg-ink-50 pb-[72px]">
      <AppManifestHead role="vendor" themeColor="#16a34a" iconPrefix="icon-vendor" />
      <header
        className="sticky top-0 z-30 border-b border-ink-200 bg-white"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/vendor/dashboard" className="flex items-center gap-2">
            <Image
              src="/icon-vendor-192.png"
              alt="ВкусМаркет Продавец"
              width={32}
              height={32}
              className="rounded-xl"
              priority
            />
            <div className="leading-tight">
              <div className="truncate text-[14px] font-extrabold text-ink-900">
                {vendor.brandName}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                Продавец
              </div>
            </div>
          </Link>
          <form action={vendorLogoutAction}>
            <button
              type="submit"
              aria-label="Выйти"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <AppInstallBanner appName="ВМ Продавец" themeColor="#16a34a" />

      <main className="mx-auto w-full max-w-3xl px-4 py-4">{children}</main>

      <VendorDashboardNav />
    </div>
  );
}
