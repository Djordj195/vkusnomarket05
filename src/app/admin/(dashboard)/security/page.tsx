import { TwoFactorSettings } from "./TwoFactorSettings";

export default function AdminSecurityPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Безопасность
        </h1>
        <p className="text-[12px] text-ink-500">
          Двухфакторная аутентификация (TOTP) для защиты админ-панели.
        </p>
      </header>

      <TwoFactorSettings />
    </div>
  );
}
