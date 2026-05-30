"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Send, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type Ticket,
  type TicketMessage,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/types";
import {
  markTicketReadAction,
  replyToTicketAction,
  updateTicketAction,
  viewTicketAction,
} from "@/server/tickets/tickets-actions";

const STATUS_TONE: Record<TicketStatus, "warn" | "info" | "success" | "danger"> = {
  open: "warn",
  in_progress: "info",
  waiting_user: "warn",
  resolved: "success",
  closed: "info",
};

const STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
];

const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];

export function AdminTicketDetailView({
  ticket: initialTicket,
  initialMessages,
}: {
  ticket: Ticket;
  initialMessages: TicketMessage[];
}) {
  const [ticket, setTicket] = useState(initialTicket);
  const [messages, setMessages] = useState(initialMessages);
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (ticket.unreadForSupport > 0) {
      void markTicketReadAction({ ticketId: ticket.id, side: "support" });
    }
  }, [ticket.id, ticket.unreadForSupport]);

  async function refresh() {
    const res = await viewTicketAction({
      ticketId: ticket.id,
      asAdmin: true,
    });
    if (res.ok) {
      setTicket(res.ticket);
      setMessages(res.messages);
    }
  }

  async function onReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await replyToTicketAction({
        ticketId: ticket.id,
        authorType: "support",
        authorId: "admin",
        authorName: "Поддержка",
        body: reply.trim(),
        isInternal,
      });
      if (res.ok) {
        setReply("");
        setIsInternal(false);
        await refresh();
      } else {
        setError(res.error);
      }
    } finally {
      setSending(false);
    }
  }

  function onSetStatus(status: TicketStatus) {
    startTransition(async () => {
      const res = await updateTicketAction({ ticketId: ticket.id, status });
      if (res.ok) setTicket(res.ticket);
      else setError(res.error);
    });
  }

  function onSetPriority(priority: TicketPriority) {
    startTransition(async () => {
      const res = await updateTicketAction({ ticketId: ticket.id, priority });
      if (res.ok) setTicket(res.ticket);
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-ink-500">
            {ticket.number}
          </span>
          <Badge tone={STATUS_TONE[ticket.status]}>
            {TICKET_STATUS_LABELS[ticket.status]}
          </Badge>
          <Badge
            tone={
              ticket.priority === "high" || ticket.priority === "urgent"
                ? "danger"
                : "neutral"
            }
          >
            {TICKET_PRIORITY_LABELS[ticket.priority]}
          </Badge>
        </div>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          {ticket.subject}
        </h1>
        <p className="text-[12px] text-ink-500">
          {TICKET_CATEGORY_LABELS[ticket.category]} · {ticket.requesterName} ·{" "}
          {ticket.requesterContact} · {formatDate(ticket.createdAt)}
          {ticket.orderId && (
            <>
              {" · "}заказ <span className="font-mono">{ticket.orderId}</span>
            </>
          )}
        </p>
      </header>

      <section className="rounded-2xl border border-ink-200 bg-white p-3">
        <div className="text-[12px] font-semibold text-ink-700">Статус</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const active = s === ticket.status;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSetStatus(s)}
                className={
                  active
                    ? "rounded-full bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                    : "rounded-full bg-ink-100 px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-ink-200"
                }
              >
                {TICKET_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-[12px] font-semibold text-ink-700">
          Приоритет
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRIORITIES.map((p) => {
            const active = p === ticket.priority;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onSetPriority(p)}
                className={
                  active
                    ? "rounded-full bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                    : "rounded-full bg-ink-100 px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-ink-200"
                }
              >
                {TICKET_PRIORITY_LABELS[p]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </section>

      <form onSubmit={onReply} className="space-y-2">
        <Textarea
          placeholder={
            isInternal
              ? "Внутренняя заметка для команды поддержки"
              : "Ответ клиенту"
          }
          rows={4}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          maxLength={4000}
          required
        />
        <label className="flex items-center gap-2 text-[12px] text-ink-700">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
          />
          Внутренняя заметка (клиент не увидит)
        </label>
        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth disabled={sending || !reply.trim()}>
          {sending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Отправляю…
            </>
          ) : (
            <>
              <Send size={16} />
              {isInternal ? "Сохранить заметку" : "Ответить клиенту"}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: TicketMessage }) {
  const isSupport = message.authorType === "support";
  const isSystem = message.authorType === "system";

  if (isSystem) {
    return (
      <div className="px-3 py-2 text-center text-[11px] text-ink-500">
        {message.body} · {formatDate(message.createdAt)}
      </div>
    );
  }

  if (message.isInternal) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center justify-between text-[11px] text-amber-700">
          <span className="flex items-center gap-1 font-semibold">
            <ShieldAlert size={12} /> Внутренняя заметка · {message.authorName}
          </span>
          <span>{formatDate(message.createdAt)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-[14px] text-amber-900">
          {message.body}
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        isSupport
          ? "rounded-2xl bg-sky-50 p-3"
          : "rounded-2xl bg-brand-50 p-3"
      }
    >
      <div className="flex items-center justify-between text-[11px] text-ink-500">
        <span className="font-semibold">
          {isSupport ? "Поддержка" : message.authorName}
        </span>
        <span>{formatDate(message.createdAt)}</span>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-[14px] text-ink-900">
        {message.body}
      </p>
    </div>
  );
}
