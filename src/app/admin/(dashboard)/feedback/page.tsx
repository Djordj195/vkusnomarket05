import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { listFeedbackForAdmin } from "@/server/feedback-store";
import {
  approveFeedbackAction,
  rejectFeedbackAction,
  deleteFeedbackAction,
} from "@/server/feedback-actions";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { FeedbackStatus } from "@/server/feedback-store";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string }>;

const TABS: { value: FeedbackStatus | "all"; label: string }[] = [
  { value: "pending", label: "На модерации" },
  { value: "approved", label: "Опубликованные" },
  { value: "rejected", label: "Скрытые" },
  { value: "all", label: "Все" },
];

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  pending: "На модерации",
  approved: "Опубликован",
  rejected: "Скрыт",
};

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rawStatus = sp.status ?? "pending";
  const status: FeedbackStatus | "all" =
    rawStatus === "approved" ||
    rawStatus === "rejected" ||
    rawStatus === "all" ||
    rawStatus === "pending"
      ? rawStatus
      : "pending";

  const items = await listFeedbackForAdmin(status);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-extrabold text-ink-900">
          Отзывы и предложения
        </h1>
        <p className="text-[13px] text-ink-500">
          Опубликованные отзывы появляются на главной странице и в разделе
          «Отзывы».
        </p>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = t.value === status;
          return (
            <Link
              key={t.value}
              href={
                t.value === "pending"
                  ? "/admin/feedback"
                  : `/admin/feedback?status=${t.value}`
              }
              className={
                active
                  ? "rounded-full bg-brand-600 px-3.5 py-1.5 text-[12px] font-semibold text-white"
                  : "rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-ink-50"
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white py-12 text-center">
          <MessageSquare size={28} className="text-ink-400" />
          <h2 className="mt-3 text-[15px] font-bold text-ink-900">
            Здесь пусто
          </h2>
          <p className="mt-1 max-w-xs px-4 text-[12px] text-ink-500">
            Когда клиенты оставят отзыв через приложение, он появится здесь
            на модерации.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((f) => (
            <li
              key={f.id}
              className="rounded-2xl border border-ink-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-ink-900">
                    {f.name?.trim() || "Аноним"}
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-500">
                    {formatDate(f.createdAt)}
                    {f.contact ? ` · ${f.contact}` : ""}
                  </div>
                </div>
                <Badge
                  tone={
                    f.status === "approved"
                      ? "brand"
                      : f.status === "rejected"
                      ? "neutral"
                      : "warn"
                  }
                >
                  {STATUS_LABELS[f.status]}
                </Badge>
              </div>

              <p className="mt-3 whitespace-pre-line rounded-xl bg-ink-50 p-3 text-[14px] leading-snug text-ink-900">
                {f.message}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {f.status !== "approved" && (
                  <form action={approveFeedbackAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-700"
                    >
                      Опубликовать
                    </button>
                  </form>
                )}
                {f.status !== "rejected" && (
                  <form action={rejectFeedbackAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-ink-50"
                    >
                      Скрыть
                    </button>
                  </form>
                )}
                <form action={deleteFeedbackAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <button
                    type="submit"
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-100"
                  >
                    Удалить
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
