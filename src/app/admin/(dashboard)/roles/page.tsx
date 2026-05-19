import { Shield, Users, FileText } from "lucide-react";

const ROLES = [
  {
    id: "super_admin",
    name: "Супер-админ",
    description: "Полный доступ ко всем сущностям",
    permissions: 99,
  },
  {
    id: "support",
    name: "Поддержка",
    description: "Тикеты, ограниченный просмотр заказов",
    permissions: 12,
  },
  {
    id: "vendor_owner",
    name: "Владелец продавца",
    description: "Управление витриной и каталогом",
    permissions: 20,
  },
  {
    id: "vendor_manager",
    name: "Менеджер продавца",
    description: "Каталог + заказы + аналитика",
    permissions: 14,
  },
  {
    id: "vendor_operator",
    name: "Оператор заказов",
    description: "Принимает заказы, меняет статусы",
    permissions: 6,
  },
  {
    id: "vendor_picker",
    name: "Сборщик",
    description: "Только сборка заказов",
    permissions: 3,
  },
  {
    id: "courier_platform",
    name: "Курьер платформы",
    description: "Заказы от разных продавцов",
    permissions: 5,
  },
  {
    id: "courier_shop",
    name: "Курьер магазина",
    description: "Заказы одного продавца",
    permissions: 5,
  },
  {
    id: "client",
    name: "Клиент",
    description: "Заказы, отзывы, профиль",
    permissions: 8,
  },
];

export default function AdminRolesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Роли и права</h1>
        <p className="text-[12px] text-ink-500">
          Справочник ролей и разрешений. Матрица «роль → права» —
          в разработке.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <Tile
          label="Ролей"
          value={ROLES.length.toString()}
          icon={<Shield size={18} />}
        />
        <Tile label="Пользователей" value="—" icon={<Users size={18} />} />
        <Tile label="Прав" value="—" icon={<FileText size={18} />} />
      </section>

      <ul className="space-y-2">
        {ROLES.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-ink-200 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-ink-900">
                  {r.name}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-ink-500">
                  {r.description}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                {r.permissions} прав
              </span>
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="text-[14px] font-bold text-ink-900">Что появится</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-ink-700">
          <li>Полный список permissions с группировкой по сущностям</li>
          <li>Матрица роль → права с inline-чекбоксами</li>
          <li>Создание подролей (например: «менеджер каталога»)</li>
          <li>Назначение ролей пользователям</li>
          <li>Ограничение ролей по tenant (vendor / city)</li>
          <li>Audit log изменений</li>
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
