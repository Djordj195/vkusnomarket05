"use server";

import { headers } from "next/headers";
import type {
  NotificationChannel,
  NotificationEvent,
  NotificationRecipientType,
  StoredPushSubscription,
} from "@/lib/types";
import { logAudit } from "../audit-store";
import {
  disablePushSubscription,
  getNotificationPreferences,
  listPushSubscriptions,
  saveNotificationPreference,
  savePushSubscription,
} from "./notifications-store";

function newId(): string {
  return `sub-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Сохранить web push-подписку клиента/продавца/курьера.
 * Идемпотентна по endpoint: повторный вызов обновляет last_seen_at и
 * включает подписку, если она была отключена.
 */
export async function subscribePushAction(input: {
  recipientType: NotificationRecipientType;
  recipientId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.endpoint || !input.p256dh || !input.auth) {
    return { ok: false, error: "Некорректные данные подписки." };
  }
  if (!input.recipientId) {
    return { ok: false, error: "Не указан получатель." };
  }
  const now = new Date().toISOString();
  const ua = (await headers()).get("user-agent") ?? null;
  const sub: StoredPushSubscription = {
    id: newId(),
    recipientType: input.recipientType,
    recipientId: input.recipientId,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    userAgent: ua,
    enabled: true,
    createdAt: now,
    lastSeenAt: now,
  };
  await savePushSubscription(sub);
  await logAudit({
    actorType: input.recipientType === "client" ? "client" : input.recipientType,
    actorId: input.recipientId,
    action: "notification.push_subscribed",
    targetType: "push_subscription",
    targetId: input.endpoint.slice(-32),
    payload: { recipientType: input.recipientType },
  });
  return { ok: true };
}

/**
 * Отписать подписку (например, когда пользователь снял разрешение
 * в браузере).
 */
export async function unsubscribePushAction(input: {
  endpoint: string;
}): Promise<{ ok: true }> {
  await disablePushSubscription(input.endpoint);
  return { ok: true };
}

export async function listMyPushSubscriptionsAction(input: {
  recipientType: NotificationRecipientType;
  recipientId: string;
}): Promise<StoredPushSubscription[]> {
  return listPushSubscriptions(input.recipientType, input.recipientId);
}

export async function getMyNotificationPreferencesAction(input: {
  recipientType: NotificationRecipientType;
  recipientId: string;
}) {
  return getNotificationPreferences(input.recipientType, input.recipientId);
}

export async function setNotificationPreferenceAction(input: {
  recipientType: NotificationRecipientType;
  recipientId: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  enabled: boolean;
}): Promise<{ ok: true }> {
  await saveNotificationPreference({
    id: `pref-${input.recipientType}-${input.recipientId}-${input.channel}-${input.event}`,
    recipientType: input.recipientType,
    recipientId: input.recipientId,
    channel: input.channel,
    event: input.event,
    enabled: input.enabled,
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
}
