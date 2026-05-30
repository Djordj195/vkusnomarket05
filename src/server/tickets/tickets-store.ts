import "server-only";
import type {
  Ticket,
  TicketAuthorType,
  TicketCategory,
  TicketMessage,
  TicketPriority,
  TicketRequesterType,
  TicketStatus,
} from "@/lib/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase";

// Двухрежимное хранилище тикетов: Supabase (production) или in-memory
// (preview/локально). Memory-режим переживает HMR через globalThis-ключ.

type Store = {
  tickets: Ticket[];
  messages: TicketMessage[];
  numberSeq: number;
};
const GLOBAL_KEY = "__VKUSNOMARKET_TICKETS_STORE__";

function getMemoryStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = { tickets: [], messages: [], numberSeq: 0 };
  return g[GLOBAL_KEY]!;
}

// ─── row ↔ object ───

type TicketRow = {
  id: string;
  number: string;
  requester_type: TicketRequesterType;
  requester_id: string | null;
  requester_name: string;
  requester_contact: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  order_id: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  last_message_at: string;
  last_message_preview: string;
  unread_for_user: number;
  unread_for_support: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
};

function rowToTicket(r: TicketRow): Ticket {
  return {
    id: r.id,
    number: r.number,
    requesterType: r.requester_type,
    requesterId: r.requester_id,
    requesterName: r.requester_name,
    requesterContact: r.requester_contact,
    category: r.category,
    subject: r.subject,
    status: r.status,
    priority: r.priority,
    orderId: r.order_id,
    assigneeId: r.assignee_id,
    assigneeName: r.assignee_name,
    lastMessageAt: r.last_message_at,
    lastMessagePreview: r.last_message_preview,
    unreadForUser: r.unread_for_user,
    unreadForSupport: r.unread_for_support,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    resolvedAt: r.resolved_at,
    closedAt: r.closed_at,
  };
}

function ticketToRow(t: Ticket): TicketRow {
  return {
    id: t.id,
    number: t.number,
    requester_type: t.requesterType,
    requester_id: t.requesterId,
    requester_name: t.requesterName,
    requester_contact: t.requesterContact,
    category: t.category,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    order_id: t.orderId,
    assignee_id: t.assigneeId,
    assignee_name: t.assigneeName,
    last_message_at: t.lastMessageAt,
    last_message_preview: t.lastMessagePreview,
    unread_for_user: t.unreadForUser,
    unread_for_support: t.unreadForSupport,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    resolved_at: t.resolvedAt,
    closed_at: t.closedAt,
  };
}

type MessageRow = {
  id: string;
  ticket_id: string;
  author_type: TicketAuthorType;
  author_id: string | null;
  author_name: string | null;
  body: string;
  attachments: string[] | null;
  is_internal: boolean;
  created_at: string;
};

function rowToMessage(r: MessageRow): TicketMessage {
  return {
    id: r.id,
    ticketId: r.ticket_id,
    authorType: r.author_type,
    authorId: r.author_id,
    authorName: r.author_name,
    body: r.body,
    attachments: r.attachments ?? [],
    isInternal: r.is_internal,
    createdAt: r.created_at,
  };
}

function messageToRow(m: TicketMessage): MessageRow {
  return {
    id: m.id,
    ticket_id: m.ticketId,
    author_type: m.authorType,
    author_id: m.authorId,
    author_name: m.authorName,
    body: m.body,
    attachments: m.attachments,
    is_internal: m.isInternal,
    created_at: m.createdAt,
  };
}

// ─── номера ───

export async function nextTicketNumber(): Promise<string> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    // Простой и надёжный fallback: count + 1. Уникальный constraint на
    // tickets.number прикроет редкие гонки повторной попыткой выше.
    const { count } = await sb
      .from("tickets")
      .select("id", { count: "exact", head: true });
    return `T-${String((count ?? 0) + 1).padStart(4, "0")}`;
  }
  const s = getMemoryStore();
  s.numberSeq += 1;
  return `T-${String(s.numberSeq).padStart(4, "0")}`;
}

// ─── tickets ───

export async function saveTicket(t: Ticket): Promise<Ticket> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb.from("tickets").upsert(ticketToRow(t));
    if (error) throw new Error(`saveTicket: ${error.message}`);
    return t;
  }
  const s = getMemoryStore();
  const idx = s.tickets.findIndex((x) => x.id === t.id);
  if (idx === -1) s.tickets.unshift(t);
  else s.tickets[idx] = t;
  return t;
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("tickets")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`getTicketById: ${error.message}`);
    return data ? rowToTicket(data as TicketRow) : null;
  }
  const s = getMemoryStore();
  return s.tickets.find((x) => x.id === id) ?? null;
}

export type ListTicketsFilters = {
  status?: TicketStatus | "active" | "all";
  priority?: TicketPriority;
  category?: TicketCategory;
  requesterType?: TicketRequesterType;
  requesterId?: string;
  assigneeId?: string;
  orderId?: string;
  limit?: number;
};

const ACTIVE_STATUSES: TicketStatus[] = ["open", "in_progress", "waiting_user"];

export async function listTickets(
  filters: ListTicketsFilters = {}
): Promise<Ticket[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    let q = sb
      .from("tickets")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(filters.limit ?? 200);
    if (filters.status === "active") q = q.in("status", ACTIVE_STATUSES);
    else if (filters.status && filters.status !== "all")
      q = q.eq("status", filters.status);
    if (filters.priority) q = q.eq("priority", filters.priority);
    if (filters.category) q = q.eq("category", filters.category);
    if (filters.requesterType) q = q.eq("requester_type", filters.requesterType);
    if (filters.requesterId) q = q.eq("requester_id", filters.requesterId);
    if (filters.assigneeId) q = q.eq("assignee_id", filters.assigneeId);
    if (filters.orderId) q = q.eq("order_id", filters.orderId);
    const { data, error } = await q;
    if (error) throw new Error(`listTickets: ${error.message}`);
    return (data as TicketRow[]).map(rowToTicket);
  }
  let list = [...getMemoryStore().tickets];
  if (filters.status === "active")
    list = list.filter((t) => ACTIVE_STATUSES.includes(t.status));
  else if (filters.status && filters.status !== "all")
    list = list.filter((t) => t.status === filters.status);
  if (filters.priority) list = list.filter((t) => t.priority === filters.priority);
  if (filters.category) list = list.filter((t) => t.category === filters.category);
  if (filters.requesterType)
    list = list.filter((t) => t.requesterType === filters.requesterType);
  if (filters.requesterId)
    list = list.filter((t) => t.requesterId === filters.requesterId);
  if (filters.assigneeId)
    list = list.filter((t) => t.assigneeId === filters.assigneeId);
  if (filters.orderId) list = list.filter((t) => t.orderId === filters.orderId);
  list.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  return list.slice(0, filters.limit ?? 200);
}

export async function countTicketsByStatus(): Promise<Record<TicketStatus, number>> {
  const totals: Record<TicketStatus, number> = {
    open: 0,
    in_progress: 0,
    waiting_user: 0,
    resolved: 0,
    closed: 0,
  };
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("tickets")
      .select("status")
      .limit(10000);
    if (error) return totals;
    for (const row of (data as { status: TicketStatus }[]) ?? []) {
      totals[row.status] = (totals[row.status] ?? 0) + 1;
    }
    return totals;
  }
  for (const t of getMemoryStore().tickets) {
    totals[t.status] = (totals[t.status] ?? 0) + 1;
  }
  return totals;
}

// ─── messages ───

export async function appendTicketMessage(m: TicketMessage): Promise<TicketMessage> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { error } = await sb.from("ticket_messages").insert(messageToRow(m));
    if (error) throw new Error(`appendTicketMessage: ${error.message}`);
    return m;
  }
  getMemoryStore().messages.push(m);
  return m;
}

export async function listTicketMessages(
  ticketId: string,
  options: { includeInternal?: boolean } = {}
): Promise<TicketMessage[]> {
  let messages: TicketMessage[];
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`listTicketMessages: ${error.message}`);
    messages = (data as MessageRow[]).map(rowToMessage);
  } else {
    messages = getMemoryStore()
      .messages.filter((m) => m.ticketId === ticketId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  if (!options.includeInternal) {
    messages = messages.filter((m) => !m.isInternal);
  }
  return messages;
}
