import "server-only";
import { headers } from "next/headers";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type { AuditActorType, AuditEntry } from "@/lib/audit";

// Двухрежимное хранилище audit-логов: Supabase (при наличии env) либо память.

type Row = {
  id: string;
  actor_type: AuditActorType;
  actor_id: string | null;
  actor_label: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  payload: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

function rowToEntry(r: Row): AuditEntry {
  return {
    id: r.id,
    actorType: r.actor_type,
    actorId: r.actor_id,
    actorLabel: r.actor_label,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    payload: r.payload,
    ip: r.ip,
    userAgent: r.user_agent,
    createdAt: r.created_at,
  };
}

type Store = { logs: AuditEntry[] };
const globalKey = "__VKUSNOMARKET_AUDIT_STORE__";

function getMemoryStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[globalKey]) g[globalKey] = { logs: [] };
  return g[globalKey]!;
}

export type LogInput = {
  actorType: AuditActorType;
  actorId?: string | null;
  actorLabel?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  payload?: Record<string, unknown> | null;
};

async function resolveRequestContext(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip = (forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null) || null;
    const ua = h.get("user-agent");
    return { ip, userAgent: ua && ua.length > 0 ? ua : null };
  } catch {
    return { ip: null, userAgent: null };
  }
}

/**
 * Пишет запись в audit_logs. Никогда не кидает наружу — ошибка логирования
 * не должна валить пользовательское действие. Возвращает true при успехе.
 */
export async function logAudit(input: LogInput): Promise<boolean> {
  const { ip, userAgent } = await resolveRequestContext();
  const entry: AuditEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    actorLabel: input.actorLabel ?? null,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    payload: input.payload ?? null,
    ip,
    userAgent,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabaseAdmin()!;
      const { error } = await sb.from("audit_logs").insert({
        id: entry.id,
        actor_type: entry.actorType,
        actor_id: entry.actorId,
        actor_label: entry.actorLabel,
        action: entry.action,
        target_type: entry.targetType,
        target_id: entry.targetId,
        payload: entry.payload,
        ip: entry.ip,
        user_agent: entry.userAgent,
      });
      if (error) {
        console.error("[audit] supabase insert failed:", error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error("[audit] unexpected error:", e);
      return false;
    }
  }
  getMemoryStore().logs.unshift(entry);
  // Защита от роста памяти в dev — храним не больше 500 записей.
  if (getMemoryStore().logs.length > 500) {
    getMemoryStore().logs.length = 500;
  }
  return true;
}

export type ListAuditFilters = {
  actorType?: AuditActorType;
  action?: string;
  targetType?: string;
  targetId?: string;
  limit?: number;
};

export async function listAudit(
  filters: ListAuditFilters = {}
): Promise<AuditEntry[]> {
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    let q = sb
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (filters.actorType) q = q.eq("actor_type", filters.actorType);
    if (filters.action) q = q.eq("action", filters.action);
    if (filters.targetType) q = q.eq("target_type", filters.targetType);
    if (filters.targetId) q = q.eq("target_id", filters.targetId);
    const { data, error } = await q;
    if (error) throw new Error(`listAudit: ${error.message}`);
    return (data as Row[]).map(rowToEntry);
  }

  let logs = getMemoryStore().logs;
  if (filters.actorType) logs = logs.filter((l) => l.actorType === filters.actorType);
  if (filters.action) logs = logs.filter((l) => l.action === filters.action);
  if (filters.targetType) logs = logs.filter((l) => l.targetType === filters.targetType);
  if (filters.targetId) logs = logs.filter((l) => l.targetId === filters.targetId);
  return logs.slice(0, limit);
}
