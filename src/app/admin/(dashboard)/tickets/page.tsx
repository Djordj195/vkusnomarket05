import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/types";
import {
  countTicketsByStatus,
  listTickets,
} from "@/server/tickets/tickets-store";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  status?: string;
  priority?: string;
  category?: string;
}>;

const STATUS_TABS: { value: TicketStatus | "active" | "all"; label: string }[] = [
  { value: "active", label: "Активные" },
  { value: "open", label: "Открытые" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting_user", label: "Ждут клиента" },
  { value: "resolved", label: "Решённые" },
  { value: "closed", label: "Закрытые" },
  { value: "all", label: "Все" },
];

const PRIORITY_OPTIONS: { value: TicketPriority | "all"; label: string }[] = [
  { value: "all", label: "Все приоритеты" },
  { value: "urgent", label: TICKET_PRIORITY_LABELS.urgent },
  { value: "high", label: TICKET_PRIORITY_LABELS.high },
  { value: "normal", label: TICKET_PRIORITY_LABELS.normal },
  { value: "low", label: TICKET_PRIORITY_LABELS.low },
];

const CATEGORY_OPTIONS: { value: TicketCategory | "all"; label: string }[] = [
  { value: "all", label: "Все категории" },
  ...(
    Object.keys(TICKET_CATEGORY_LABELS) as TicketCategory[]
  ).map((c) => ({ value: c, label: TICKET_CATEGORY_LABELS[c] })),
];

const STATUS_TONE: Record<
  TicketStatus,
  "warn" | "info" | "success" | "danger"
> = {
  open: "warn",
  in_progress: "info",
  waiting_user: "warn",
  resolved: "success",
  closed: "info",
};

function buildHref(
  current: { status?: string; priority?: string; category?: string },
  override: Partial<{ status: string; priority: string; category: string }>
): string {
  const merged = { ...current, ...override };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v && v !== "all") sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/admin/tickets?${qs}` : "/admin/tickets";
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const rawStatus = sp.status ?? "active";
  const status =
    rawStatus === "all"
      ? "all"
      : rawStatus === "active"
        ? "active"
        : (rawStatus as TicketStatus);

  const priority =
    sp.priority && sp.priority !== "all"
      ? (sp.priority as TicketPriority)
      : undefined;

  const category =
    sp.category && sp.category !== "all"
      ? (sp.category as TicketCategory)
      : undefined;

  const [counts, tickets] = await Promise.all([
    countTicketsByStatus(),
    listTickets({ status, priority, category, limit: 200 }),
  ]);

  const escalated = tickets.filter(
    (t) => t.priority === "high" || t.priority === "urgent"
  ).length;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-ink-900">Тикеты</h1>
          <p className="text-[12px] text-ink-500">
            Обращения клиентов, продавцов и курьеров.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <Tile label="Открытые" value={String(counts.open ?? 0)} tone="amber" />
        <Tile label="В работе" value={String(counts.in_progress ?? 0)} tone="brand" />
        <Tile label="Эскалация" value={String(escalated)} tone="red" />
      </section>

      <section className="space-y-2 rounded-2xl border border-ink-200 bg-white p-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((t) => {
            const active = (sp.status ?? "active") === t.value;
            return (
              <Link
                key={t.value}
                href={buildHref(sp, { status: t.value })}
                className={
                  active
                    ? "rounded-full bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                    : "rounded-full bg-ink-100 px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-ink-200"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <form className="flex flex-wrap gap-2">
          <input type="hidden" name="status" value={sp.status ?? "active"} />
          <Select
            name="priority"
            value={sp.priority ?? "all"}
            options={PRIORITY_OPTIONS}
          />
          <Select
            name="category"
            value={sp.category ?? "all"}
            options={CATEGORY_OPTIONS}
          />
          <button
            type="submit"
            className="rounded-xl bg-ink-100 px-4 text-[13px] font-semibold text-ink-700 hover:bg-ink-200"
          >
            Применить
          </button>
        </form>
      </section>

      <section className="space-y-2">
        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
              <ClipboardList size={22} />
            </div>
            <p className="mt-3 text-[14px] font-bold text-ink-900">
              Нет обращений по выбранным фильтрам
            </p>
          </div>
        ) : (
          tickets.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tickets/${t.id}`}
              className="block rounded-2xl border border-ink-100 bg-white p-3 hover:border-brand-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-ink-500">
                  {t.number}
                </span>
                <Badge tone={STATUS_TONE[t.status]}>
                  {TICKET_STATUS_LABELS[t.status]}
                </Badge>
                {(t.priority === "high" || t.priority === "urgent") && (
                  <Badge tone="danger">
                    {TICKET_PRIORITY_LABELS[t.priority]}
                  </Badge>
                )}
                {t.unreadForSupport > 0 && (
                  <Badge tone="brand">{t.unreadForSupport} новых</Badge>
                )}
              </div>
              <div className="mt-1 truncate text-[14px] font-bold text-ink-900">
                {t.subject}
              </div>
              <div className="mt-0.5 truncate text-[12px] text-ink-500">
                {t.lastMessagePreview}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-ink-500">
                <span>
                  {TICKET_CATEGORY_LABELS[t.category]} · {t.requesterName}
                </span>
                <span>{formatDate(t.lastMessageAt)}</span>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "brand" | "amber" | "red";
}) {
  const colors: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
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

function Select({
  name,
  value,
  options,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={value}
      className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
