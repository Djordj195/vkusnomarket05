import { Crown, User } from "lucide-react";
import { getCurrentVendor } from "@/server/vendor-auth";
import { PlaceholderCard, SubpageHeader } from "@/components/vendor/PlaceholderCard";

const ROLES = [
  { key: "owner", label: "Владелец", description: "Полный доступ ко всему" },
  { key: "manager", label: "Менеджер", description: "Каталог, заказы, отзывы" },
  { key: "operator", label: "Оператор заказов", description: "Только заказы" },
  { key: "picker", label: "Сборщик", description: "Сборка и упаковка" },
  { key: "courier", label: "Курьер магазина", description: "Доставка своих заказов" },
];

export default async function VendorStaffPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  return (
    <div className="space-y-4">
      <SubpageHeader title="Сотрудники и роли" />

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Crown size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-ink-900">Владелец</div>
            <div className="truncate text-[12px] text-ink-500">
              {vendor.contacts?.phone ?? "Номер не указан"}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[14px] font-bold text-ink-900">Роли</h2>
        <ul className="space-y-2">
          {ROLES.map((r) => (
            <li
              key={r.key}
              className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <User size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-ink-900">
                  {r.label}
                </div>
                <div className="truncate text-[11px] text-ink-500">
                  {r.description}
                </div>
              </div>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                0
              </span>
            </li>
          ))}
        </ul>
      </section>

      <PlaceholderCard
        title="Добавление сотрудников — в разработке"
        description="Скоро вы сможете приглашать сотрудников по телефону и назначать им роли. Полная RBAC-матрица настраивается в суперадминке (Phase 6)."
      />
    </div>
  );
}
