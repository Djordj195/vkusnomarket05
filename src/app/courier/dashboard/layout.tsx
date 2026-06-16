import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentCourier } from "@/server/courier-auth";
import { courierLogoutAction } from "@/server/courier-login-actions";
import { AppManifestHead } from "@/components/pwa/AppManifestHead";
import { AppInstallBanner } from "@/components/pwa/AppInstallBanner";
import { CourierBottomNav } from "./CourierBottomNav";

export const dynamic = "force-dynamic";

export default async function CourierDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const courier = await getCurrentCourier();
  if (!courier) {
    redirect("/courier/login");
  }

  return (
    <div className="min-h-screen bg-ink-50 pb-[72px]">
      <AppManifestHead role="courier" themeColor="#ea580c" iconPrefix="icon-courier" />
      <header
        className="sticky top-0 z-30 border-b border-ink-200 bg-white"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/courier/dashboard" className="flex items-center gap-2">
            <Image
              src="/icon-courier-192.png"
              alt="ВкусМаркет Курьер"
              width={32}
              height={32}
              className="rounded-xl"
              priority
            />
            <div className="leading-tight">
              <div className="text-[13px] font-extrabold text-ink-900">
                Курьер
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-orange-600">
                {courier.type === "platform" ? "Платформы" : "Магазина"}
              </div>
            </div>
          </Link>
          <form action={courierLogoutAction}>
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

      <AppInstallBanner appName="ВМ Курьер" themeColor="#ea580c" />

      <main className="mx-auto w-full max-w-3xl px-4 py-4">{children}</main>

      <CourierBottomNav />
    </div>
  );
}
