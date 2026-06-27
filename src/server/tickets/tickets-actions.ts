"use server";

import { revalidatePath } from "next/cache";
import type {
  Ticket,
  TicketAuthorType,
  TicketCategory,
  TicketMessage,
  TicketPriority,
  TicketRequesterType,
  TicketStatus,
} from "@/lib/types";
import { isAdminAuthenticated } from "../admin-auth";
import { logAudit } from "../audit-store";
import { getOrderById } from "../orders-store";
import {
  notifyTicketCreated,
  notifyTicketReplied,
} from "../notifications/events";
import {
  appendTicketMessage,
  getTicketById,
  listTicketMessages,
  listTickets,
  nextTicketNumber,
  saveTicket,
  type ListTicketsFilters,
} from "./tickets-store";

async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Доступ запрещён");
  }
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function previewOf(body: string): string {
  const t = body.trim().replace(/\s+/g, " ");
  return t.length > 140 ? `${t.slice(0, 137)}…` : t;
}

function detectPriority(
  category: TicketCategory,
  text: string
): TicketPriority {
  const lower = text.toLowerCase();
  if (
    category === "complaint" ||
    /сроч|жалоб|деньги|обман|мошен|испорч|просроч|плохо|воду|отрав/.test(lower)
  ) {
    return "high";
  }
  if (category === "payment" || category === "delivery") return "normal";
  return "normal";
}

// ─── создание тикета (клиент / гость / продавец / курьер) ───

export type CreateTicketInput = {
  requesterType: TicketRequesterType;
  requesterId: string | null;
  requesterName: string;
  requesterContact: string;
  category: TicketCategory;
  subject: string;
  body: string;
  orderId?: string | null;
  attachments?: string[];
};

export async function createTicketAction(
  input: CreateTicketInput
): Promise<{ ok: true; ticket: Ticket } | { ok: false; error: string }> {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject) return { ok: false, error: "Укажите тему обращения." };
  if (subject.length > 200)
    return { ok: false, error: "Тема не длиннее 200 символов." };
  if (!body) return { ok: false, error: "Опишите проблему." };
  if (body.length > 4000)
    return { ok: false, error: "Сообщение не длиннее 4000 символов." };
  const name = input.requesterName.trim();
  if (!name) return { ok: false, error: "Укажите имя." };
  const contact = input.requesterContact.trim();
  if (!contact) return { ok: false, error: "Укажите контакт (телефон или email)." };

  let orderId = input.orderId?.trim() || null;
  if (orderId) {
    const o = await getOrderById(orderId);
    if (!o) orderId = null;
  }

  const now = new Date().toISOString();
  const number = await nextTicketNumber();
  const ticket: Ticket = {
    id: newId("tkt"),
    number,
    requesterType: input.requesterType,
    requesterId: input.requesterId,
    requesterName: name,
    requesterContact: contact,
    category: input.category,
    subject,
    status: "open",
    priority: detectPriority(input.category, `${subject} ${body}`),
    orderId,
    assigneeId: null,
    assigneeName: null,
    lastMessageAt: now,
    lastMessagePreview: previewOf(body),
    unreadForUser: 0,
    unreadForSupport: 1,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    closedAt: null,
  };
  await saveTicket(ticket);

  const message: TicketMessage = {
    id: newId("msg"),
    ticketId: ticket.id,
    authorType: "requester",
    authorId: input.requesterId,
    authorName: name,
    body,
    attachments: input.attachments ?? [],
    isInternal: false,
    createdAt: now,
  };
  await appendTicketMessage(message);

  await logAudit({
    actorType:
      input.requesterType === "client"
        ? "client"
        : input.requesterType === "guest"
          ? "system"
          : input.requesterType,
    actorId: input.requesterId ?? null,
    actorLabel: name,
    action: "ticket.created",
    targetType: "ticket",
    targetId: ticket.id,
    payload: {
      number: ticket.number,
      category: ticket.category,
      priority: ticket.priority,
      orderId: ticket.orderId,
    },
  });

  await notifyTicketCreated(ticket);

  revalidatePath("/admin/tickets");
  revalidatePath("/market/support/tickets");
  return { ok: true, ticket };
}

// ─── ответ в тикет (поддержка/админ) ───

export async function replyToTicketAction(input: {
  ticketId: string;
  authorType: TicketAuthorType;
  authorId: string | null;
  authorName: string;
  body: string;
  attachments?: string[];
  isInternal?: boolean;
  newStatus?: TicketStatus;
}): Promise<{ ok: true; message: TicketMessage } | { ok: false; error: string }> {
  const body = input.body.trim();
  if (!body) return { ok: false, error: "Сообщение пустое." };
  if (body.length > 4000)
    return { ok: false, error: "Сообщение не длиннее 4000 символов." };

  const ticket = await getTicketById(input.ticketId);
  if (!ticket) return { ok: false, error: "Тикет не найден." };

  if (input.authorType !== "requester") {
    await requireAdmin();
  } else if (
    ticket.requesterId &&
    input.authorId &&
    ticket.requesterId !== input.authorId
  ) {
    return { ok: false, error: "Нет прав для ответа в чужой тикет." };
  }

  const now = new Date().toISOString();
  const message: TicketMessage = {
    id: newId("msg"),
    ticketId: ticket.id,
    authorType: input.authorType,
    authorId: input.authorId ?? null,
    authorName: input.authorName,
    body,
    attachments: input.attachments ?? [],
    isInternal: input.isInternal === true,
    createdAt: now,
  };
  await appendTicketMessage(message);

  // Обновляем счётчики и last_message_at, не для внутренних заметок.
  const updated: Ticket = { ...ticket, updatedAt: now };
  if (!message.isInternal) {
    updated.lastMessageAt = now;
    updated.lastMessagePreview = previewOf(body);
    if (input.authorType === "requester") {
      updated.unreadForSupport += 1;
      // Клиент ответил → статус возвращается в "open" если был "waiting_user"
      if (updated.status === "waiting_user") updated.status = "open";
    } else if (input.authorType === "support") {
      updated.unreadForUser += 1;
      if (updated.status === "open") updated.status = "in_progress";
    }
  }
  if (input.newStatus) {
    updated.status = input.newStatus;
    if (input.newStatus === "resolved" && !updated.resolvedAt)
      updated.resolvedAt = now;
    if (input.newStatus === "closed" && !updated.closedAt)
      updated.closedAt = now;
  }
  await saveTicket(updated);

  await logAudit({
    actorType:
      input.authorType === "requester"
        ? ticket.requesterType === "guest"
          ? "system"
          : (ticket.requesterType as "client" | "vendor" | "courier")
        : "admin",
    actorId: input.authorId ?? null,
    actorLabel: input.authorName,
    action: "ticket.replied",
    targetType: "ticket",
    targetId: ticket.id,
    payload: {
      number: ticket.number,
      internal: message.isInternal,
      newStatus: updated.status !== ticket.status ? updated.status : undefined,
    },
  });

  if (!message.isInternal && input.authorType !== "system") {
    await notifyTicketReplied(updated, input.authorType === "support");
  }

  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${ticket.id}`);
  revalidatePath("/market/support/tickets");
  revalidatePath(`/market/support/tickets/${ticket.id}`);
  return { ok: true, message };
}

// ─── смена статуса/приоритета/назначения (только админ) ───

export async function updateTicketAction(input: {
  ticketId: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
  assigneeName?: string | null;
}): Promise<{ ok: true; ticket: Ticket } | { ok: false; error: string }> {
  await requireAdmin();
  const ticket = await getTicketById(input.ticketId);
  if (!ticket) return { ok: false, error: "Тикет не найден." };
  const now = new Date().toISOString();
  const updated: Ticket = { ...ticket, updatedAt: now };
  if (input.status && input.status !== ticket.status) {
    updated.status = input.status;
    if (input.status === "resolved" && !updated.resolvedAt)
      updated.resolvedAt = now;
    if (input.status === "closed" && !updated.closedAt) updated.closedAt = now;
    if (input.status === "open" || input.status === "in_progress") {
      // Реоткрытие
      updated.resolvedAt = null;
      updated.closedAt = null;
    }
  }
  if (input.priority) updated.priority = input.priority;
  if (input.assigneeId !== undefined) updated.assigneeId = input.assigneeId;
  if (input.assigneeName !== undefined) updated.assigneeName = input.assigneeName;
  await saveTicket(updated);

  await logAudit({
    actorType: "admin",
    action: "ticket.updated",
    targetType: "ticket",
    targetId: ticket.id,
    payload: {
      number: ticket.number,
      from: { status: ticket.status, priority: ticket.priority },
      to: { status: updated.status, priority: updated.priority },
      assigneeId: updated.assigneeId,
    },
  });

  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${ticket.id}`);
  revalidatePath("/market/support/tickets");
  return { ok: true, ticket: updated };
}

// ─── сброс непрочитанных при открытии ───

export async function markTicketReadAction(input: {
  ticketId: string;
  side: "user" | "support";
}): Promise<{ ok: true }> {
  if (input.side === "support") {
    await requireAdmin();
  }
  const ticket = await getTicketById(input.ticketId);
  if (!ticket) return { ok: true };
  const updated: Ticket = {
    ...ticket,
    unreadForUser: input.side === "user" ? 0 : ticket.unreadForUser,
    unreadForSupport: input.side === "support" ? 0 : ticket.unreadForSupport,
  };
  if (
    updated.unreadForUser === ticket.unreadForUser &&
    updated.unreadForSupport === ticket.unreadForSupport
  ) {
    return { ok: true };
  }
  await saveTicket(updated);
  return { ok: true };
}

// ─── списки/просмотр ───

export async function listMyTicketsAction(input: {
  requesterType: TicketRequesterType;
  requesterId: string;
}): Promise<Ticket[]> {
  return listTickets({
    requesterType: input.requesterType,
    requesterId: input.requesterId,
    status: "all",
    limit: 100,
  });
}

export async function listAdminTicketsAction(
  filters: ListTicketsFilters
): Promise<Ticket[]> {
  await requireAdmin();
  return listTickets(filters);
}

export async function viewTicketAction(input: {
  ticketId: string;
  asAdmin: boolean;
  requesterId?: string | null;
}): Promise<
  | { ok: true; ticket: Ticket; messages: TicketMessage[] }
  | { ok: false; error: string }
> {
  const ticket = await getTicketById(input.ticketId);
  if (!ticket) return { ok: false, error: "Тикет не найден." };
  if (!input.asAdmin) {
    // Клиент может смотреть только свой тикет.
    if (
      ticket.requesterId &&
      input.requesterId &&
      ticket.requesterId !== input.requesterId
    ) {
      return { ok: false, error: "Нет прав." };
    }
  } else {
    await requireAdmin();
  }
  const messages = await listTicketMessages(input.ticketId, {
    includeInternal: input.asAdmin,
  });
  return { ok: true, ticket, messages };
}
