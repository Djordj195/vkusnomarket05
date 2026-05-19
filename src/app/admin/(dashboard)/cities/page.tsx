import { listAllCities } from "@/server/cities-store";
import { CityRow } from "./CityRow";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  active: "Активен",
  coming_soon: "Скоро откроемся",
  disabled: "Отключён",
};

const STATUS_TONES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  coming_soon: "bg-amber-100 text-amber-800",
  disabled: "bg-ink-200 text-ink-700",
};

export default async function AdminCitiesPage() {
  const cities = await listAllCities();

  const grouped = {
    active: cities.filter((c) => c.status === "active"),
    coming_soon: cities.filter((c) => c.status === "coming_soon"),
    disabled: cities.filter((c) => c.status === "disabled"),
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Города</h1>
        <p className="text-[12px] text-ink-500">
          Управление статусом городов: активен, скоро откроемся, отключён.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <Stat
          label="Активные"
          value={grouped.active.length}
          tone="emerald"
        />
        <Stat
          label="Скоро"
          value={grouped.coming_soon.length}
          tone="amber"
        />
        <Stat
          label="Отключённые"
          value={grouped.disabled.length}
          tone="ink"
        />
      </section>

      {(["active", "coming_soon", "disabled"] as const).map((status) => {
        const list = grouped[status];
        if (list.length === 0) return null;
        return (
          <section key={status}>
            <h2 className="mb-2 flex items-center gap-2 text-[14px] font-bold text-ink-900">
              <span>{STATUS_LABELS[status]}</span>
              <span
                className={`rounded-full ${STATUS_TONES[status]} px-2 py-0.5 text-[11px]`}
              >
                {list.length}
              </span>
            </h2>
            <ul className="space-y-2">
              {list.map((c) => (
                <CityRow key={c.id} city={c} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "ink";
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    ink: "bg-ink-100 text-ink-700",
  };
  return (
    <div className={`rounded-2xl ${colors[tone]} p-3 text-center`}>
      <div className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </div>
      <div className="mt-1 text-[20px] font-extrabold">{value}</div>
    </div>
  );
}
