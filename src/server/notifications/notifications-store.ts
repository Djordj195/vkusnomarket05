import "server-only";
import type {
  NotificationChannel,
  NotificationEvent,
  NotificationLogEntry,
  NotificationLogStatus,
  NotificationPreference,
  NotificationRecipientType,
  StoredPushSubscription,
} from "@/lib/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase";

// Двухрежимное хранилище подписок / настроек / журнала уведомлений.

type Store = {
  subscriptions: StoredPushSubscription[];
  preferences: NotificationPreference[];
  log: NotificationLogEntry[];
};
const globalKey = "__VKUSNOMARKET_NOTIFICATIONS_STORE__";

function getMemoryStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[globalKey])
    g[globalKey] = { subscriptions: [], preferences: [], log: [] };
  return g[globalKey]!;
}

// ────────────────── push_subscriptions ──────────────────

type SubRow = {
  id: string;
  recipient_type: NotificationRecipientType;
  recipient_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  enabled: boolean;
  created_at: string;
  last_seen_at: string;
};

function rowToSub(r: SubRow): StoredPushSubscription {
  return {
    id: r.id,
    recipientType: r.recipient_type,
    recipientId: r.recipient_id,
    endpoint: r.endpoint,
    p256dh: r.p256dh,
    auth: r.auth,
    userAgent: r.user_agent,
    enabled: r.enabled,
    createdAt: r.created_at,
    lastSeenAt: r.last_seen_at,
  };
}

function subToRow(s: StoredPushSubscription): SubRow {
  return {
    id: s.id,
    recipient_type: s.recipientType,
    recipient_id: s.recipientId,
    endpoint: s.endpoint,
    p256dh: s.p256dh,
    auth: s.auth,
    user_agent: s.userAgent,
    enabled: s.enabled,
    created_at: s.createdAt,
    last_seen_at: s.lastSeenAt,
  };
}

export async function savePushSubscription(
  sub: StoredPushSubscription
): Promise<StoredPushSubscription> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb
      .from("push_subscriptions")
      .upsert(subToRow(sub), { onConflict: "endpoint" });
    if (error) throw new Error(`savePushSubscription: ${error.message}`);
    return sub;
  }
  const s = getMemoryStore();
  const idx = s.subscriptions.findIndex((x) => x.endpoint === sub.endpoint);
  if (idx === -1) s.subscriptions.push(sub);
  else s.subscriptions[idx] = sub;
  return sub;
}

export async function listPushSubscriptions(
  recipientType: NotificationRecipientType,
  recipientId: string
): Promise<StoredPushSubscription[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("push_subscriptions")
      .select("*")
      .eq("recipient_type", recipientType)
      .eq("recipient_id", recipientId)
      .eq("enabled", true);
    if (error) throw new Error(`listPushSubscriptions: ${error.message}`);
    return (data as SubRow[]).map(rowToSub);
  }
  return getMemoryStore().subscriptions.filter(
    (s) =>
      s.enabled &&
      s.recipientType === recipientType &&
      s.recipientId === recipientId
  );
}

export async function disablePushSubscription(endpoint: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    await sb
      .from("push_subscriptions")
      .update({ enabled: false })
      .eq("endpoint", endpoint);
    return;
  }
  const s = getMemoryStore();
  const sub = s.subscriptions.find((x) => x.endpoint === endpoint);
  if (sub) sub.enabled = false;
}

// ────────────────── notification_preferences ──────────────────

type PrefRow = {
  id: string;
  recipient_type: NotificationRecipientType;
  recipient_id: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  enabled: boolean;
  updated_at: string;
};

function rowToPref(r: PrefRow): NotificationPreference {
  return {
    id: r.id,
    recipientType: r.recipient_type,
    recipientId: r.recipient_id,
    channel: r.channel,
    event: r.event,
    enabled: r.enabled,
    updatedAt: r.updated_at,
  };
}

function prefToRow(p: NotificationPreference): PrefRow {
  return {
    id: p.id,
    recipient_type: p.recipientType,
    recipient_id: p.recipientId,
    channel: p.channel,
    event: p.event,
    enabled: p.enabled,
    updated_at: p.updatedAt,
  };
}

export async function getNotificationPreferences(
  recipientType: NotificationRecipientType,
  recipientId: string
): Promise<NotificationPreference[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("notification_preferences")
      .select("*")
      .eq("recipient_type", recipientType)
      .eq("recipient_id", recipientId);
    if (error) throw new Error(`getNotificationPreferences: ${error.message}`);
    return (data as PrefRow[]).map(rowToPref);
  }
  return getMemoryStore().preferences.filter(
    (p) => p.recipientType === recipientType && p.recipientId === recipientId
  );
}

export async function saveNotificationPreference(
  p: NotificationPreference
): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb
      .from("notification_preferences")
      .upsert(prefToRow(p), {
        onConflict: "recipient_type,recipient_id,channel,event",
      });
    if (error) throw new Error(`saveNotificationPreference: ${error.message}`);
    return;
  }
  const s = getMemoryStore();
  const idx = s.preferences.findIndex(
    (x) =>
      x.recipientType === p.recipientType &&
      x.recipientId === p.recipientId &&
      x.channel === p.channel &&
      x.event === p.event
  );
  if (idx === -1) s.preferences.push(p);
  else s.preferences[idx] = p;
}

/**
 * Проверить включён ли канал × событие для адресата.
 * Если в БД нет явной записи — считаем включённым (opt-out default).
 */
export async function isNotificationEnabled(
  recipientType: NotificationRecipientType,
  recipientId: string,
  channel: NotificationChannel,
  event: NotificationEvent
): Promise<boolean> {
  const prefs = await getNotificationPreferences(recipientType, recipientId);
  const explicit = prefs.find(
    (p) => p.channel === channel && p.event === event
  );
  if (!explicit) return true;
  return explicit.enabled;
}

// ────────────────── notification_log ──────────────────

type LogRow = {
  id: string;
  recipient_type: NotificationRecipientType;
  recipient_id: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  status: NotificationLogStatus;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
};

function rowToLog(r: LogRow): NotificationLogEntry {
  return {
    id: r.id,
    recipientType: r.recipient_type,
    recipientId: r.recipient_id,
    channel: r.channel,
    event: r.event,
    status: r.status,
    title: r.title,
    body: r.body,
    payload: r.payload,
    error: r.error,
    createdAt: r.created_at,
  };
}

export async function appendNotificationLog(
  entry: NotificationLogEntry
): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb.from("notification_log").insert({
      id: entry.id,
      recipient_type: entry.recipientType,
      recipient_id: entry.recipientId,
      channel: entry.channel,
      event: entry.event,
      status: entry.status,
      title: entry.title,
      body: entry.body,
      payload: entry.payload,
      error: entry.error,
    });
    if (error) {
      console.error("[notif-log]", error.message);
    }
    return;
  }
  const s = getMemoryStore();
  s.log.unshift(entry);
  if (s.log.length > 500) s.log.length = 500;
}

export type ListLogFilters = {
  channel?: NotificationChannel;
  status?: NotificationLogStatus;
  event?: NotificationEvent;
  limit?: number;
};

export async function listNotificationLog(
  filters: ListLogFilters = {}
): Promise<NotificationLogEntry[]> {
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    let q = sb
      .from("notification_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (filters.channel) q = q.eq("channel", filters.channel);
    if (filters.status) q = q.eq("status", filters.status);
    if (filters.event) q = q.eq("event", filters.event);
    const { data, error } = await q;
    if (error) throw new Error(`listNotificationLog: ${error.message}`);
    return (data as LogRow[]).map(rowToLog);
  }
  let arr = getMemoryStore().log.slice();
  if (filters.channel) arr = arr.filter((x) => x.channel === filters.channel);
  if (filters.status) arr = arr.filter((x) => x.status === filters.status);
  if (filters.event) arr = arr.filter((x) => x.event === filters.event);
  return arr.slice(0, limit);
}
