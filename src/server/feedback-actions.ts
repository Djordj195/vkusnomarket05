"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_CONTACTS } from "@/lib/constants";
import { isAdminAuthenticated } from "@/server/admin-auth";
import {
  createFeedback,
  deleteFeedback,
  setFeedbackStatus,
} from "@/server/feedback-store";

export type FeedbackInput = {
  name: string;
  contact: string;
  message: string;
};

export type FeedbackResult =
  | { ok: true }
  | { ok: false; error: string };

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function notifyTelegram(input: {
  name: string;
  contact: string;
  message: string;
  id: string | null;
}): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) return false;

  const lines: string[] = [];
  lines.push("<b>📝 Новый отзыв / предложение</b>");
  lines.push("");
  if (input.name) lines.push(`<b>Имя:</b> ${escape(input.name)}`);
  if (input.contact) lines.push(`<b>Контакт:</b> ${escape(input.contact)}`);
  if (!input.name && !input.contact) {
    lines.push(`<i>Анонимно (телефон ${DEFAULT_CONTACTS.phone || "—"})</i>`);
  }
  lines.push("");
  lines.push(escape(input.message));
  if (input.id) {
    lines.push("");
    lines.push("<i>Откройте админку → «Отзывы», чтобы опубликовать или скрыть.</i>");
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_ADMIN_CHAT_ID,
          text: lines.join("\n"),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    if (!res.ok) {
      console.error("[feedback] Telegram returned non-ok:", res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[feedback] Telegram error:", e);
    return false;
  }
}

export async function submitFeedback(
  input: FeedbackInput
): Promise<FeedbackResult> {
  const name = input.name.trim();
  const contact = input.contact.trim();
  const message = input.message.trim();

  if (!message) return { ok: false, error: "Напишите ваш отзыв или предложение." };
  if (message.length > 2000)
    return { ok: false, error: "Сообщение слишком длинное (до 2000 знаков)." };

  // Persist to Supabase as 'pending' so it can be moderated in the admin
  // panel. If Supabase isn't configured or the migration hasn't been
  // applied yet, we still try to send to Telegram so feedback isn't lost.
  let id: string | null = null;
  try {
    const created = await createFeedback({ name, contact, message });
    id = created?.id ?? null;
  } catch (e) {
    console.error("[feedback] createFeedback failed:", e);
  }

  await notifyTelegram({ name, contact, message, id });

  if (!id) {
    // No DB row, Telegram may or may not have succeeded. Treat as success
    // for the user — duplicates are OK; missing DB row just means it won't
    // appear in moderation queue.
    console.warn("[feedback] saved without DB row (table missing or DB off)");
  }

  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// Admin moderation actions (called from /admin/feedback)
// ──────────────────────────────────────────────────────────────────────────

async function ensureAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Не авторизован.");
  }
}

export async function approveFeedbackAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не указан id.");
  await setFeedbackStatus(id, "approved", "admin");
  revalidatePath("/admin/feedback");
  revalidatePath("/");
  revalidatePath("/reviews");
}

export async function rejectFeedbackAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не указан id.");
  await setFeedbackStatus(id, "rejected", "admin");
  revalidatePath("/admin/feedback");
  revalidatePath("/");
  revalidatePath("/reviews");
}

export async function deleteFeedbackAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не указан id.");
  await deleteFeedback(id);
  revalidatePath("/admin/feedback");
  revalidatePath("/");
  revalidatePath("/reviews");
}
