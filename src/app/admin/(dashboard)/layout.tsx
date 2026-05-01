import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  Home,
  LogOut,
  Package,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { isAdminAuthenticated } from "@/server/admin-auth";
import { logoutAction } from "@/server/admin-actions";
import { Logo } from "@/components/layout/Logo";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col md:flex-row">
        <aside className="md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 border-b md:border-b-0 md:border-r border-ink-200 bg-white">
          <div className="flex items-center justify-between gap-2 px-4 py-4 md:px-5">
            <Link href="/admin" className="block">
              <Logo size={32} />
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
          <nav className="px-2 pb-3 md:pb-5 overflow-x-auto">
            <ul className="flex md:flex-col gap-1 md:gap-0.5 md:space-y-0.5">
              <NavItem href="/admin" icon={<Home size={18} />} label="Обзор" />
              <NavItem href="/admin/orders" icon={<ClipboardList size={18} />} label="Заказы" />
              <NavItem href="/admin/products" icon={<Package size={18} />} label="Товары" />
              <NavItem href="/admin/categories" icon={<Store size={18} />} label="Категории" />
              <NavItem href="/admin/shops" icon={<Store size={18} />} label="Магазины и лавки" />
              <NavItem href="/admin/couriers" icon={<Truck size={18} />} label="Курьеры" />
              <NavItem href="/admin/users" icon={<Users size={18} />} label="Клиенты" />
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li className="flex">
      <Link
        href={href}
        className="flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium text-ink-700 hover:bg-ink-100 whitespace-nowrap"
      >
        <span className="text-ink-500">{icon}</span>
        {label}
      </Link>
    </li>
  );
}
