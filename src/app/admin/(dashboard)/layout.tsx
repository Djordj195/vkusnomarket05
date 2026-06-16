import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { isAdminAuthenticated } from "@/server/admin-auth";
import { logoutAction } from "@/server/admin-actions";
import { AppManifestHead } from "@/components/pwa/AppManifestHead";
import { AppInstallBanner } from "@/components/pwa/AppInstallBanner";
import { AdminBottomNav } from "./AdminBottomNav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/Maksud");
  }

  return (
    <div className="min-h-screen bg-ink-50 pb-[72px]">
      <AppManifestHead role="admin" themeColor="#dc2626" iconPrefix="icon-admin" />
      <header
        className="sticky top-0 z-30 border-b border-ink-200 bg-white"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/icon-admin-192.png"
              alt="ВкусМаркет Админ"
              width={32}
              height={32}
              className="rounded-xl"
              priority
            />
            <span className="text-[15px] font-extrabold tracking-tight text-ink-900">
              ВкусМаркет{" "}
              <span className="text-red-600">Админ</span>
            </span>
          </Link>
          <form action={logoutAction}>
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

      <AppInstallBanner appName="ВМ Админ" themeColor="#dc2626" />

      <main className="mx-auto w-full max-w-3xl px-4 py-4">{children}</main>

      <AdminBottomNav />
    </div>
  );
}
