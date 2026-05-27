import { Fragment } from "react";
import { Check, FileText, Minus, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  allRoles,
  hasPermission,
  PERMISSIONS,
  PERMISSION_GROUPS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  rolePermissionCount,
  type PermissionGroup,
} from "@/lib/rbac";

const GROUP_LABELS: Record<PermissionGroup, string> = {
  vendors: "Продавцы",
  products: "Каталог",
  orders: "Заказы",
  couriers: "Курьеры",
  cities: "Города",
  zones: "Зоны",
  tariffs: "Тарифы",
  support: "Поддержка",
  users: "Пользователи",
  legal: "Юр.документы",
  audit: "Audit-логи",
  system: "Система",
};

export default function AdminRolesPage() {
  const roles = allRoles();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Роли и права</h1>
        <p className="text-[12px] text-ink-500">
          Матрица «разрешение × роль». Источник правды —{" "}
          <code className="rounded bg-ink-100 px-1 text-[11px]">src/lib/rbac.ts</code>.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <Tile
          label="Ролей"
          value={roles.length.toString()}
          icon={<Shield size={18} />}
        />
        <Tile
          label="Разрешений"
          value={PERMISSIONS.length.toString()}
          icon={<FileText size={18} />}
        />
        <Tile
          label="Связей"
          value={Object.values(ROLE_PERMISSIONS)
            .reduce((s, list) => s + list.length, 0)
            .toString()}
          icon={<Users size={18} />}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-[14px] font-bold text-ink-900">Роли</h2>
        <ul className="space-y-2">
          {roles.map((r) => (
            <li
              key={r}
              className="rounded-2xl border border-ink-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-ink-900">
                    {ROLE_LABELS[r]}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-500">
                    {ROLE_DESCRIPTIONS[r]}
                  </div>
                </div>
                <Badge tone="neutral">{rolePermissionCount(r)} прав</Badge>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-[14px] font-bold text-ink-900">Матрица</h2>
        <p className="text-[11px] text-ink-500">
          Прокрутите таблицу вправо, если строки шире экрана.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
          <table className="min-w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-ink-50 text-left">
                <th className="sticky left-0 z-10 min-w-[180px] bg-ink-50 px-3 py-2 font-bold text-ink-900">
                  Разрешение
                </th>
                {roles.map((r) => (
                  <th
                    key={r}
                    className="border-l border-ink-200 px-2 py-2 text-center font-bold text-ink-900"
                    title={ROLE_DESCRIPTIONS[r]}
                  >
                    <div className="leading-tight">{ROLE_LABELS[r]}</div>
                    <div className="mt-0.5 text-[10px] font-normal text-ink-500">
                      {rolePermissionCount(r)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) => {
                const groupPerms = PERMISSIONS.filter((p) => p.group === group);
                if (groupPerms.length === 0) return null;
                return (
                  <Fragment key={group}>
                    <tr className="bg-ink-50/60">
                      <th
                        colSpan={1 + roles.length}
                        className="sticky left-0 px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink-700"
                      >
                        {GROUP_LABELS[group]}
                      </th>
                    </tr>
                    {groupPerms.map((perm) => (
                      <tr
                        key={perm.key}
                        className="border-t border-ink-100 hover:bg-brand-50/40"
                      >
                        <td className="sticky left-0 z-10 bg-white px-3 py-2 text-ink-900">
                          <div className="text-[12px] font-semibold leading-tight">
                            {perm.label}
                          </div>
                          <div className="text-[10px] text-ink-400">
                            {perm.key}
                          </div>
                        </td>
                        {roles.map((r) => {
                          const ok = hasPermission(r, perm.key);
                          return (
                            <td
                              key={r}
                              className="border-l border-ink-100 px-2 py-2 text-center"
                            >
                              {ok ? (
                                <Check
                                  size={14}
                                  className="mx-auto text-brand-600"
                                  aria-label="Разрешено"
                                />
                              ) : (
                                <Minus
                                  size={12}
                                  className="mx-auto text-ink-300"
                                  aria-label="Нет"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[14px] font-bold text-ink-900">Дальше по плану</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-ink-700">
          <li>Назначение ролей конкретным пользователям (user → role[])</li>
          <li>Кастомные подроли по копии шаблонной (override permissions)</li>
          <li>Ограничение ролей по tenant (vendor / city)</li>
          <li>Применение `requirePermission` ко всем server actions</li>
        </ul>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-ink-50 p-3 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-white text-ink-700">
        {icon}
      </div>
      <div className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="text-[18px] font-extrabold text-ink-900">{value}</div>
    </div>
  );
}
