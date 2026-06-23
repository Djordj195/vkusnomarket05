import "server-only";

// Email-провайдер. По умолчанию используется Resend (https://resend.com)
// через HTTP API — не требует npm-пакета, ключ бесплатного тарифа
// генерируется в кабинете. SendGrid поддерживается как fallback,
// если задан SENDGRID_API_KEY и не задан RESEND_API_KEY.
//
// Без ключей — demo-режим: письмо логируется в console, не отправляется.
//
// ENV:
//   EMAIL_FROM           — "Имя <noreply@example.com>" (обязательно для реальной отправки)
//   RESEND_API_KEY       — re_xxx (бесплатный тариф 3000 писем/месяц)
//   SENDGRID_API_KEY     — SG.xxx (альтернатива)

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailResult =
  | { ok: true; messageId?: string; demo?: boolean }
  | { ok: false; error: string };

function readFrom(): string {
  return (
    process.env.EMAIL_FROM ||
    `ВкусМаркет <noreply@${
      (process.env.NEXT_PUBLIC_SITE_URL ?? "vkusnomarket05.vercel.app").replace(
        /^https?:\/\//,
        ""
      )
    }>`
  );
}

export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
}

async function sendViaResend(msg: EmailMessage): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY!;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: readFrom(),
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        ...(msg.html ? { html: msg.html } : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `resend HTTP ${res.status}: ${text}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, messageId: data.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "resend network error",
    };
  }
}

async function sendViaSendgrid(msg: EmailMessage): Promise<EmailResult> {
  const key = process.env.SENDGRID_API_KEY!;
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: msg.to }] }],
        from: { email: readFrom().replace(/.*<(.+)>.*/, "$1"), name: "ВкусМаркет" },
        subject: msg.subject,
        content: [
          { type: "text/plain", value: msg.text },
          ...(msg.html ? [{ type: "text/html", value: msg.html }] : []),
        ],
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `sendgrid HTTP ${res.status}: ${text}` };
    }
    return { ok: true, messageId: res.headers.get("x-message-id") ?? undefined };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "sendgrid network error",
    };
  }
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (process.env.RESEND_API_KEY) return sendViaResend(msg);
  if (process.env.SENDGRID_API_KEY) return sendViaSendgrid(msg);
  console.log("[email:demo]", msg.to, msg.subject, "—", msg.text.slice(0, 80));
  return { ok: true, demo: true };
}
