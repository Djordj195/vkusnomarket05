import "server-only";
import type {
  NotificationChannel,
  NotificationEvent,
  NotificationLogEntry,
  NotificationLogStatus,
  NotificationRecipientType,
} from "@/lib/types";
import {
  appendNotificationLog,
  disablePushSubscription,
  isNotificationEnabled,
  listPushSubscriptions,
} from "./notifications-store";
import { sendEmail } from "./email";
import { sendWebPush, type WebPushPayload } from "./push";
import { getSmsProvider } from "../sms";
import { normalizeRuPhone } from "../sms";
import { orderNewHtml, genericNotificationHtml } from "./email-templates";

// Универсальный диспетчер: принимает событие, описывает что отправить
// в каждый из каналов, и сам решает что фактически отправлять с учётом
// preferences. Никогда не кидает наружу — ошибка отправки уведомления
// не должна валить пользовательское действие.

function newId(): string {
  return `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function log(entry: Omit<NotificationLogEntry, "id" | "createdAt">) {
  await appendNotificationLog({
    id: newId(),
    createdAt: new Date().toISOString(),
    ...entry,
  });
}

export type NotifyInput = {
  recipientType: NotificationRecipientType;
  recipientId: string;
  event: NotificationEvent;
  // Контакты для прямых каналов (email/sms).
  email?: string;
  phone?: string;
  // Содержимое уведомления — едино для всех каналов.
  title: string;
  body: string;
  // Deep-link, открывается при клике на push.
  url?: string;
  // Произвольные данные для логирования.
  payload?: Record<string, unknown>;
  // Какие каналы пробовать. По умолчанию — все три.
  channels?: NotificationChannel[];
};

/**
 * Отправить уведомление через все подходящие каналы.
 * Возвращает массив результатов (1 на канал).
 */
export async function notify(input: NotifyInput): Promise<
  Array<{ channel: NotificationChannel; status: NotificationLogStatus }>
> {
  const channels: NotificationChannel[] =
    input.channels ?? ["push", "email", "sms"];
  const results: Array<{
    channel: NotificationChannel;
    status: NotificationLogStatus;
  }> = [];

  for (const channel of channels) {
    const status = await deliver(channel, input);
    results.push({ channel, status });
  }
  return results;
}

async function deliver(
  channel: NotificationChannel,
  input: NotifyInput
): Promise<NotificationLogStatus> {
  const enabled = await isNotificationEnabled(
    input.recipientType,
    input.recipientId,
    channel,
    input.event
  );
  if (!enabled) {
    await log({
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      channel,
      event: input.event,
      status: "skipped",
      title: input.title,
      body: input.body,
      payload: input.payload ?? null,
      error: "preference disabled",
    });
    return "skipped";
  }

  try {
    if (channel === "push") {
      return await deliverPush(input);
    }
    if (channel === "email") {
      return await deliverEmail(input);
    }
    return await deliverSms(input);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    await log({
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      channel,
      event: input.event,
      status: "failed",
      title: input.title,
      body: input.body,
      payload: input.payload ?? null,
      error: msg,
    });
    return "failed";
  }
}

async function deliverPush(input: NotifyInput): Promise<NotificationLogStatus> {
  const subs = await listPushSubscriptions(
    input.recipientType,
    input.recipientId
  );
  if (subs.length === 0) {
    await log({
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      channel: "push",
      event: input.event,
      status: "skipped",
      title: input.title,
      body: input.body,
      payload: input.payload ?? null,
      error: "no subscriptions",
    });
    return "skipped";
  }

  const payload: WebPushPayload = {
    title: input.title,
    body: input.body,
    url: input.url,
    data: input.payload,
  };

  let anySent = false;
  let lastError: string | null = null;
  for (const sub of subs) {
    const res = await sendWebPush(sub, payload);
    if (res.ok) {
      anySent = true;
    } else {
      lastError = res.error;
      if (res.gone) {
        // Сабскрипшен отозван клиентом — отключаем его в БД.
        await disablePushSubscription(sub.endpoint);
      }
    }
  }
  await log({
    recipientType: input.recipientType,
    recipientId: input.recipientId,
    channel: "push",
    event: input.event,
    status: anySent ? "sent" : "failed",
    title: input.title,
    body: input.body,
    payload: input.payload ?? null,
    error: anySent ? null : lastError,
  });
  return anySent ? "sent" : "failed";
}

async function deliverEmail(
  input: NotifyInput
): Promise<NotificationLogStatus> {
  if (!input.email) {
    await log({
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      channel: "email",
      event: input.event,
      status: "skipped",
      title: input.title,
      body: input.body,
      payload: input.payload ?? null,
      error: "no email",
    });
    return "skipped";
  }
  const htmlBuilder =
    input.event === "order.new" ? orderNewHtml : genericNotificationHtml;
  const html = htmlBuilder({
    title: input.title,
    body: input.body,
    url: input.url,
  });
  const res = await sendEmail({
    to: input.email,
    subject: input.title,
    text: input.body + (input.url ? `\n\n${input.url}` : ""),
    html,
  });
  await log({
    recipientType: input.recipientType,
    recipientId: input.recipientId,
    channel: "email",
    event: input.event,
    status: res.ok ? "sent" : "failed",
    title: input.title,
    body: input.body,
    payload: input.payload ?? null,
    error: res.ok ? null : res.error,
  });
  return res.ok ? "sent" : "failed";
}

async function deliverSms(input: NotifyInput): Promise<NotificationLogStatus> {
  if (!input.phone) {
    await log({
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      channel: "sms",
      event: input.event,
      status: "skipped",
      title: input.title,
      body: input.body,
      payload: input.payload ?? null,
      error: "no phone",
    });
    return "skipped";
  }
  const normalized = normalizeRuPhone(input.phone);
  if (!normalized) {
    await log({
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      channel: "sms",
      event: input.event,
      status: "failed",
      title: input.title,
      body: input.body,
      payload: input.payload ?? null,
      error: "invalid phone",
    });
    return "failed";
  }
  const provider = getSmsProvider();
  const text = `${input.title}: ${input.body}`.slice(0, 280);
  const res = await provider.sendText(normalized, text);
  await log({
    recipientType: input.recipientType,
    recipientId: input.recipientId,
    channel: "sms",
    event: input.event,
    status: res.ok ? "sent" : "failed",
    title: input.title,
    body: input.body,
    payload: input.payload ?? null,
    error: res.ok ? null : res.error,
  });
  return res.ok ? "sent" : "failed";
}
