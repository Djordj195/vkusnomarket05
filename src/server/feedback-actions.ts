"use server";

import { DEFAULT_CONTACTS } from "@/lib/constants";

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

export async function submitFeedback(
  input: FeedbackInput
): Promise<FeedbackResult> {
  const name = input.name.trim();
  const contact = input.contact.trim();
  const message = input.message.trim();

  if (!message) return { ok: false, error: "Напишите ваш отзыв или предложение." };
  if (message.length > 2000)
    return { ok: false, error: "Сообщение слишком длинное (до 2000 знаков)." };

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    // Telegram not configured — still accept the submission so the form works
    // for the user; log to server console so the message isn't fully lost.
    console.warn(
      "[feedback] Telegram not configured. Message:",
      JSON.stringify({ name, contact, message })
    );
    return { ok: true };
  }

  const lines: string[] = [];
  lines.push("<b>📝 Новый отзыв / предложение</b>");
  lines.push("");
  if (name) lines.push(`<b>Имя:</b> ${escape(name)}`);
  if (contact) lines.push(`<b>Контакт:</b> ${escape(contact)}`);
  if (!name && !contact) {
    lines.push(`<i>Анонимно (телефон ${DEFAULT_CONTACTS.phone || "—"})</i>`);
  }
  lines.push("");
  lines.push(escape(message));

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
      return { ok: false, error: "Не удалось отправить. Попробуйте ещё раз." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[feedback] Telegram error:", e);
    return { ok: false, error: "Не удалось отправить. Попробуйте ещё раз." };
  }
}
