import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  listNotificationLog,
  type ListLogFilters,
} from "@/server/notifications/notifications-store";
import {
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_EVENT_LABELS,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationLogStatus,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = {
  channel?: string;
  status?: string;
  event?: string;
};

const CHANNELS: NotificationChannel[] = ["push", "email", "sms"];
const STATUSES: NotificationLogStatus[] = ["sent", "queued", "failed", "skipped"];

const STATUS_TONE: Record<
  NotificationLogStatus,
  "warn" | "info" | "success" | "danger"
> = {
  sent: "success",
  queued: "warn",
  failed: "danger",
  skipped: "info",
};

const STATUS_LABELS: Record<NotificationLogStatus, string> = {
  sent: "Отправлено",
  queued: "В очереди",
  failed: "Ошибка",
  skipped: "Пропущено",
};

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters: ListLogFilters = { limit: 200 };
  if (sp.channel && CHANNELS.includes(sp.channel as NotificationChannel)) {
    filters.channel = sp.channel as NotificationChannel;
  }
  if (sp.status && STATUSES.includes(sp.status as NotificationLogStatus)) {
    filters.status = sp.status as NotificationLogStatus;
  }
  if (sp.event) {
    filters.event = sp.event as NotificationEvent;
  }
  const entries = await listNotificationLog(filters);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Уведомления</h1>
        <p className="text-[12px] text-ink-500">
          Журнал отправок push / email / SMS. Каналы привязаны к подпискам
          (Web Push) и контактам адресата.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 text-[12px]">
        <FilterLink href="/admin/notifications" label="Все" active={!filters.channel && !filters.status} />
        {CHANNELS.map((c) => (
          <FilterLink
            key={c}
            href={`/admin/notifications?channel=${c}`}
            label={NOTIFICATION_CHANNEL_LABELS[c]}
            active={filters.channel === c}
          />
        ))}
        {STATUSES.map((s) => (
          <FilterLink
            key={s}
            href={`/admin/notifications?status=${s}`}
            label={STATUS_LABELS[s]}
            active={filters.status === s}
          />
        ))}
      </nav>

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 p-6 text-center text-[13px] text-ink-500">
          В журнале пока пусто. После первого триггера (новый заказ, смена
          статуса, оплата) здесь появятся записи.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="rounded-2xl border border-ink-200 bg-white p-3 text-[13px]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="shrink-0 text-ink-400" />
                    <span className="truncate font-semibold text-ink-900">
                      {e.title ?? "(без заголовка)"}
                    </span>
                  </div>
                  {e.body && (
                    <div className="mt-0.5 truncate text-[12px] text-ink-700">
                      {e.body}
                    </div>
                  )}
                  <div className="mt-1 text-[11px] text-ink-500">
                    {formatDate(e.createdAt)} ·{" "}
                    {NOTIFICATION_EVENT_LABELS[e.event] ?? e.event} ·{" "}
                    {NOTIFICATION_CHANNEL_LABELS[e.channel]} →{" "}
                    {e.recipientType}/{e.recipientId.slice(0, 14)}
                  </div>
                  {e.error && (
                    <div className="mt-1 text-[11px] text-rose-600">
                      {e.error}
                    </div>
                  )}
                </div>
                <Badge tone={STATUS_TONE[e.status]}>
                  {STATUS_LABELS[e.status]}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-brand-600 px-3 py-1 font-semibold text-white"
          : "rounded-full border border-ink-200 px-3 py-1 text-ink-700 hover:bg-ink-50"
      }
    >
      {label}
    </Link>
  );
}
