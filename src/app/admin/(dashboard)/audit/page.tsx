import Link from "next/link";
import { ScrollText, User } from "lucide-react";
import { listAudit, type ListAuditFilters } from "@/server/audit-store";
import { Badge } from "@/components/ui/Badge";
import { actionLabel, AUDIT_ACTOR_LABELS, type AuditActorType } from "@/lib/audit";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = {
  actorType?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
};

const ACTOR_TYPES: AuditActorType[] = [
  "admin",
  "vendor",
  "courier",
  "client",
  "system",
];

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters: ListAuditFilters = {};
  if (sp.actorType && ACTOR_TYPES.includes(sp.actorType as AuditActorType)) {
    filters.actorType = sp.actorType as AuditActorType;
  }
  if (sp.action) filters.action = sp.action;
  if (sp.targetType) filters.targetType = sp.targetType;
  if (sp.targetId) filters.targetId = sp.targetId;

  const entries = await listAudit({ ...filters, limit: 200 });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">Audit-логи</h1>
        <p className="text-[12px] text-ink-500">
          Журнал управляющих действий: модерация, статусы заказов,
          смена городов и зон. Хранится в таблице{" "}
          <code className="rounded bg-ink-100 px-1 text-[11px]">
            audit_logs
          </code>
          .
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 text-[12px]">
        <FilterLink
          href="/admin/audit"
          label="Все"
          active={!filters.actorType}
        />
        {ACTOR_TYPES.map((t) => (
          <FilterLink
            key={t}
            href={`/admin/audit?actorType=${t}`}
            label={AUDIT_ACTOR_LABELS[t]}
            active={filters.actorType === t}
          />
        ))}
      </nav>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-[12px] text-ink-500">
          Записей не найдено. Сделайте любое действие в админке
          (например, переключите статус города или продавца) — оно
          попадёт сюда.
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="rounded-2xl border border-ink-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={toneForActor(e.actorType)}>
                      {AUDIT_ACTOR_LABELS[e.actorType]}
                    </Badge>
                    <span className="text-[13px] font-bold text-ink-900">
                      {actionLabel(e.action)}
                    </span>
                  </div>

                  {e.actorLabel && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-ink-600">
                      <User size={11} />
                      <span className="truncate">
                        {e.actorLabel}
                        {e.actorId ? (
                          <span className="ml-1 text-ink-400">
                            ({e.actorId})
                          </span>
                        ) : null}
                      </span>
                    </div>
                  )}

                  {e.targetType && (
                    <div className="mt-0.5 text-[11px] text-ink-500">
                      Объект:{" "}
                      <span className="font-semibold text-ink-700">
                        {e.targetType}
                      </span>
                      {e.targetId ? (
                        <span className="ml-1 text-ink-400">
                          {e.targetId}
                        </span>
                      ) : null}
                    </div>
                  )}

                  {e.payload && Object.keys(e.payload).length > 0 && (
                    <pre className="mt-1.5 max-h-32 overflow-auto rounded-lg bg-ink-50 p-2 text-[10px] leading-snug text-ink-700">
                      {JSON.stringify(e.payload, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="shrink-0 text-right text-[10px] text-ink-400">
                  <div>{formatDate(e.createdAt)}</div>
                  {e.ip && <div className="mt-0.5">{e.ip}</div>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer className="rounded-2xl border border-ink-200 bg-white p-3 text-[11px] text-ink-500">
        <div className="mb-1 flex items-center gap-1 font-semibold text-ink-700">
          <ScrollText size={12} />
          <span>Что попадает в журнал</span>
        </div>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>Модерация продавцов (одобрение, блокировка, поднятие в TOP)</li>
          <li>Смена статуса города (Махачкала → активен)</li>
          <li>Смена статуса заказа и назначение курьера</li>
          <li>Курьерские саб-статусы (направляюсь / прибыл / доставил)</li>
          <li>Создание, изменение, удаление зон доставки</li>
        </ul>
      </footer>

      <p className="text-center text-[11px] text-ink-400">
        Показано {entries.length} последних записей.
      </p>
    </div>
  );
}

function toneForActor(
  t: AuditActorType
): "brand" | "accent" | "info" | "neutral" | "warn" {
  switch (t) {
    case "admin":
      return "brand";
    case "vendor":
      return "accent";
    case "courier":
      return "info";
    case "system":
      return "warn";
    case "client":
    default:
      return "neutral";
  }
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
          : "rounded-full border border-ink-200 bg-white px-3 py-1 text-ink-700 hover:border-brand-300"
      }
    >
      {label}
    </Link>
  );
}
