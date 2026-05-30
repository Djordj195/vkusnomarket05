"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/store/auth";
import {
  TICKET_CATEGORY_LABELS,
  type TicketCategory,
  type TicketRequesterType,
} from "@/lib/types";
import { createTicketAction } from "@/server/tickets/tickets-actions";

const CATEGORIES: TicketCategory[] = [
  "order",
  "payment",
  "delivery",
  "product",
  "account",
  "vendor",
  "courier",
  "complaint",
  "suggestion",
  "other",
];

export function NewTicketForm({ orderId }: { orderId: string | null }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);

  const [category, setCategory] = useState<TicketCategory>(
    orderId ? "order" : "other"
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requesterType: TicketRequesterType = user ? "client" : "guest";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await createTicketAction({
        requesterType,
        requesterId: user?.phone ?? null,
        requesterName: name,
        requesterContact: contact,
        category,
        subject,
        body,
        orderId,
      });
      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      router.push(`/support/tickets/${result.ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить.");
      setSubmitting(false);
    }
  }

  return (
    <form className="px-4 pt-3 pb-6 space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-700">
            Категория
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="block w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[15px] text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {TICKET_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {orderId && (
        <p className="rounded-xl bg-sky-50 px-3 py-2 text-[12px] text-sky-800">
          Обращение будет связано с заказом{" "}
          <span className="font-mono">{orderId}</span>.
        </p>
      )}

      <Input
        label="Тема"
        placeholder="Кратко опишите проблему"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={200}
        required
      />

      <Textarea
        label="Сообщение"
        placeholder="Опишите подробности: что произошло, когда, что ожидалось"
        rows={6}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        required
      />

      <Input
        label="Имя"
        placeholder="Как к вам обращаться"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Input
        label="Контакт для связи"
        placeholder="Телефон или email"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        hint={
          user
            ? "По умолчанию — номер вашего аккаунта."
            : "Укажите телефон или email, мы напишем по нему."
        }
        required
      />

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Отправляю…
          </>
        ) : (
          "Отправить обращение"
        )}
      </Button>
    </form>
  );
}
