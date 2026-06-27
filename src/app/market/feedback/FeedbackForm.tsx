"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/store/auth";
import { submitFeedback } from "@/server/feedback-actions";
import { formatPhone } from "@/lib/utils";

export function FeedbackForm() {
  const user = useAuth((s) => s.user);
  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(
    user?.phone ? formatPhone(user.phone) : ""
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!message.trim()) {
      setError("Напишите ваш отзыв или предложение.");
      return;
    }
    setSubmitting(true);
    const res = await submitFeedback({ name, contact, message });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
    setMessage("");
  };

  if (done) {
    return (
      <div className="flex flex-col items-center text-center rounded-3xl bg-emerald-50 p-6">
        <CheckCircle2 size={40} className="text-emerald-600" />
        <h2 className="mt-3 text-[18px] font-extrabold text-ink-900">
          Спасибо за отзыв!
        </h2>
        <p className="mt-1 text-[14px] text-ink-600">
          Мы получили ваше сообщение и обязательно его прочитаем.
        </p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => {
            setDone(false);
          }}
        >
          Написать ещё
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Ваше имя (необязательно)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="given-name"
      />
      <Input
        label="Телефон или email для ответа (необязательно)"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        autoComplete="tel"
      />
      <Textarea
        label="Ваш отзыв или предложение"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={6}
        required
      />
      {error && (
        <div className="rounded-2xl bg-red-50 p-3 text-[13px] text-red-700">
          {error}
        </div>
      )}
      <Button type="submit" size="lg" fullWidth disabled={submitting}>
        {submitting ? "Отправляем…" : "Отправить"}
      </Button>
    </form>
  );
}
