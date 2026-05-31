"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { StarRating } from "@/components/ui/StarRating";
import { useAuth } from "@/store/auth";
import {
  submitReviewAction,
  type SubmitReviewInput,
} from "@/server/reviews-actions";
import type { ReviewTargetType } from "@/server/reviews-store";

type ReviewFormProps = {
  targetType: ReviewTargetType;
  targetId: string;
  targetName: string;
};

export function ReviewForm({ targetType, targetId, targetName }: ReviewFormProps) {
  const user = useAuth((s) => s.user);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <div className="rounded-2xl bg-ink-50 p-4 text-center text-[13px] text-ink-600">
        <a href="/auth" className="font-semibold text-brand-600 hover:underline">
          Войдите
        </a>{" "}
        по номеру телефона, чтобы оставить отзыв.
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Поставьте оценку от 1 до 5 звёзд.");
      return;
    }

    setSubmitting(true);
    const input: SubmitReviewInput = {
      userPhone: user.phone,
      userName: user.name ?? "",
      targetType,
      targetId,
      rating,
      comment: comment.trim(),
    };
    const res = await submitReviewAction(input);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center text-center rounded-2xl bg-emerald-50 p-5">
        <CheckCircle2 size={36} className="text-emerald-600" />
        <h3 className="mt-2 text-[16px] font-bold text-ink-900">
          Спасибо за отзыв!
        </h3>
        <p className="mt-1 text-[13px] text-ink-600">
          Ваш отзыв отправлен на модерацию и скоро появится на странице.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-ink-700">
          Ваша оценка «{targetName}»
        </p>
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>
      <Textarea
        label="Комментарий (необязательно)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Расскажите о впечатлениях…"
      />
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-[13px] text-red-700">
          {error}
        </div>
      )}
      <Button type="submit" size="md" fullWidth disabled={submitting}>
        {submitting ? "Отправляем…" : "Отправить отзыв"}
      </Button>
    </form>
  );
}
