"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, MessageSquare, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/auth";
import { formatDate } from "@/lib/utils";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  type Ticket,
  type TicketStatus,
} from "@/lib/types";
import { listMyTicketsAction } from "@/server/tickets/tickets-actions";

const STATUS_TONE: Record<TicketStatus, "warn" | "info" | "success" | "danger"> = {
  open: "warn",
  in_progress: "info",
  waiting_user: "warn",
  resolved: "success",
  closed: "info",
};

export function MyTicketsView() {
  const user = useAuth((s) => s.user);
  const [tickets, setTickets] = useState<Ticket[] | null>(user ? null : []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await listMyTicketsAction({
          requesterType: "client",
          requesterId: user.phone,
        });
        if (!cancelled) setTickets(list);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Не удалось загрузить.");
        setTickets([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="px-4 pt-6 pb-6 space-y-4">
        <section className="rounded-2xl bg-ink-50 p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink-500">
            <ClipboardList size={22} />
          </div>
          <h2 className="mt-3 text-[16px] font-extrabold text-ink-900">
            Войдите в аккаунт
          </h2>
          <p className="mt-1 text-[12px] text-ink-500">
            История обращений привязана к вашему номеру.
          </p>
          <Link href="/market/auth" className="mt-3 inline-block">
            <Button size="sm">Войти</Button>
          </Link>
        </section>
        <CreateLink />
      </div>
    );
  }

  if (tickets === null) {
    return (
      <div className="flex items-center justify-center px-4 pt-10 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-6 space-y-3">
      <CreateLink />
      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
          {error}
        </p>
      )}
      {tickets.length === 0 ? (
        <section className="rounded-2xl bg-ink-50 p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink-500">
            <ClipboardList size={22} />
          </div>
          <h2 className="mt-3 text-[16px] font-extrabold text-ink-900">
            У вас пока нет обращений
          </h2>
          <p className="mt-1 text-[12px] text-ink-500">
            Создайте первое обращение, и здесь появится переписка с поддержкой.
          </p>
        </section>
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/market/support/tickets/${t.id}`}
                className="block rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-ink-500">
                        {t.number}
                      </span>
                      <Badge tone={STATUS_TONE[t.status]}>
                        {TICKET_STATUS_LABELS[t.status]}
                      </Badge>
                      {t.unreadForUser > 0 && (
                        <Badge tone="danger">{t.unreadForUser}</Badge>
                      )}
                    </div>
                    <div className="mt-1 truncate text-[14px] font-bold text-ink-900">
                      {t.subject}
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-ink-500">
                      {t.lastMessagePreview}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-ink-500">
                    {TICKET_CATEGORY_LABELS[t.category]}
                    <div>{formatDate(t.lastMessageAt)}</div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateLink() {
  return (
    <Link
      href="/market/support/tickets/new"
      className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Plus size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold text-ink-900">
          Создать обращение
        </div>
        <div className="text-[11px] text-ink-500">
          Вопрос, жалоба или предложение — ответим оперативно
        </div>
      </div>
      <MessageSquare size={18} className="text-ink-400" />
    </Link>
  );
}
