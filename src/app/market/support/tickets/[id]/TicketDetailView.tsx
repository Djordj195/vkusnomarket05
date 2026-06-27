"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useAuth } from "@/store/auth";
import { formatDate } from "@/lib/utils";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type Ticket,
  type TicketMessage,
  type TicketStatus,
} from "@/lib/types";
import {
  markTicketReadAction,
  replyToTicketAction,
  viewTicketAction,
} from "@/server/tickets/tickets-actions";

const STATUS_TONE: Record<TicketStatus, "warn" | "info" | "success" | "danger"> = {
  open: "warn",
  in_progress: "info",
  waiting_user: "warn",
  resolved: "success",
  closed: "info",
};

export function TicketDetailView({ ticketId }: { ticketId: string }) {
  const user = useAuth((s) => s.user);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await viewTicketAction({
      ticketId,
      asAdmin: false,
      requesterId: user?.phone ?? null,
    });
    if (!res.ok) {
      setError(res.error);
      setMessages([]);
      return;
    }
    setTicket(res.ticket);
    setMessages(res.messages);
  }, [ticketId, user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await viewTicketAction({
        ticketId,
        asAdmin: false,
        requesterId: user?.phone ?? null,
      });
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error);
        setMessages([]);
        return;
      }
      setTicket(res.ticket);
      setMessages(res.messages);
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId, user]);

  useEffect(() => {
    if (!ticket) return;
    if (ticket.unreadForUser > 0) {
      void markTicketReadAction({ ticketId, side: "user" });
    }
  }, [ticket, ticketId]);

  if (error) {
    return (
      <div className="px-4 pt-6">
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {error}
        </p>
      </div>
    );
  }

  if (!ticket || messages === null) {
    return (
      <div className="flex items-center justify-center px-4 pt-10 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  const canReply = ticket.status !== "closed";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket || !reply.trim()) return;
    setSending(true);
    try {
      const res = await replyToTicketAction({
        ticketId: ticket.id,
        authorType: "requester",
        authorId: user?.phone ?? null,
        authorName: user?.name ?? ticket.requesterName,
        body: reply.trim(),
      });
      if (res.ok) {
        setReply("");
        await load();
      } else {
        setError(res.error);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="px-4 pt-3 pb-6 space-y-4">
      <section className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-ink-500">
            {ticket.number}
          </span>
          <Badge tone={STATUS_TONE[ticket.status]}>
            {TICKET_STATUS_LABELS[ticket.status]}
          </Badge>
          {(ticket.priority === "high" || ticket.priority === "urgent") && (
            <Badge tone="danger">{TICKET_PRIORITY_LABELS[ticket.priority]}</Badge>
          )}
        </div>
        <h2 className="mt-2 text-[16px] font-extrabold text-ink-900">
          {ticket.subject}
        </h2>
        <p className="mt-1 text-[12px] text-ink-500">
          {TICKET_CATEGORY_LABELS[ticket.category]} ·{" "}
          {formatDate(ticket.createdAt)}
          {ticket.orderId && (
            <>
              {" · "}заказ <span className="font-mono">{ticket.orderId}</span>
            </>
          )}
        </p>
      </section>

      <section className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-[13px] text-ink-500">Сообщений нет.</p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))
        )}
      </section>

      {canReply ? (
        <form onSubmit={onSubmit} className="space-y-2">
          <Textarea
            placeholder="Ваш ответ"
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={4000}
            required
          />
          <Button
            type="submit"
            fullWidth
            disabled={sending || !reply.trim()}
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Отправляю…
              </>
            ) : (
              <>
                <Send size={16} />
                Отправить
              </>
            )}
          </Button>
        </form>
      ) : (
        <p className="rounded-xl bg-ink-50 px-3 py-2 text-center text-[12px] text-ink-500">
          Тикет закрыт. Если проблема не решена — создайте новое обращение.
        </p>
      )}
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
