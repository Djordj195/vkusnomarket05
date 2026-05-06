import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/server/admin-auth";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/layout/Logo";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg shadow-ink-200/50">
        <div className="flex flex-col items-center gap-2">
          <Logo size={48} withText={false} />
          <h1 className="mt-2 text-[20px] font-extrabold text-ink-900">
            Админ-панель
          </h1>
          <p className="text-[13px] text-ink-500">ВКУСНОМАРКЕТ · Кизляр</p>
        </div>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
