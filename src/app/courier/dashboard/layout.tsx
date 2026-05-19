import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { getCurrentCourier } from "@/server/courier-auth";
import { courierLogoutAction } from "@/server/courier-login-actions";
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
      <header
        className="sticky top-0 z-30 border-b border-ink-200 bg-white"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/courier/dashboard" className="flex items-center gap-2">
            <Logo size={32} />
            <div className="leading-tight">
              <div className="text-[13px] font-extrabold text-ink-900">
                Курьер
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
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

      <main className="mx-auto w-full max-w-3xl px-4 py-4">{children}</main>

      <CourierBottomNav />
    </div>
  );
}
