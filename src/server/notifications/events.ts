import "server-only";
import type { Order, Payment, Ticket } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { getVendorById } from "../vendors-store";
import { getCourierById } from "../couriers-store";
import { notify } from "./dispatcher";

// Высокоуровневые триггеры. Никогда не кидают — ошибки логируются,
// продакшен-flow не валится из-за уведомлений.

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://vkusmarket.ru";
}

/**
 * Новый заказ → отправить продавцу + админу.
 * Триггерится из createOrder после успешного создания.
 */
export async function notifyOrderCreated(order: Order): Promise<void> {
  try {
    const total = formatPrice(order.total);
    const title = `Новый заказ № ${order.number}`;
    const body = `${total} · ${order.items.length} товаров${order.address ? ` · ${order.address}` : ""}`;
    const url = `${siteBase()}/vendor/dashboard/orders`;

    if (order.vendorId) {
      const vendor = await getVendorById(order.vendorId);
      if (vendor) {
        await notify({
          recipientType: "vendor",
          recipientId: order.vendorId,
          event: "order.new",
          email: vendor.contacts.email,
          phone: vendor.contacts.phone,
          title,
          body,
          url,
          payload: { orderId: order.id, total: order.total },
        });
      }
    }

    // Дублируем в admin-канал (in-app push для админ-PWA).
    await notify({
      recipientType: "admin",
      recipientId: "platform",
      event: "order.new",
      title,
      body,
      url: `${siteBase()}/admin/orders/${order.id}`,
      payload: { orderId: order.id },
      channels: ["push"],
    });
  } catch (e) {
    console.error("[notify:order.new]", e);
  }
}

/**
 * Изменение статуса → отправить клиенту.
 */
export async function notifyOrderStatusChanged(order: Order): Promise<void> {
  try {
    const label = ORDER_STATUS_LABELS[order.status];
    await notify({
      recipientType: "client",
      recipientId: order.customerPhone,
      event: "order.status",
      phone: order.customerPhone,
      title: `Заказ № ${order.number}: ${label}`,
      body: `Статус заказа обновлён. Сумма: ${formatPrice(order.total)}.`,
      url: `${siteBase()}/orders/${order.id}`,
      payload: { orderId: order.id, status: order.status },
    });
  } catch (e) {
    console.error("[notify:order.status]", e);
  }
}

/**
 * Назначен курьер → отправить курьеру.
 */
export async function notifyCourierAssigned(order: Order): Promise<void> {
  if (!order.courierId) return;
  try {
    const courier = await getCourierById(order.courierId);
    if (!courier) return;
    await notify({
      recipientType: "courier",
      recipientId: courier.id,
      event: "order.assigned_courier",
      phone: courier.phone,
      title: `Новый заказ к доставке № ${order.number}`,
      body: `${formatPrice(order.total)}${order.address ? ` · ${order.address}` : ""}`,
      url: `${siteBase()}/courier/dashboard/orders/active`,
      payload: { orderId: order.id },
    });
  } catch (e) {
    console.error("[notify:order.assigned_courier]", e);
  }
}

/**
 * Платёж успешно прошёл → уведомить клиента + продавца.
 */
export async function notifyPaymentSucceeded(
  payment: Payment,
  orders: Order[]
): Promise<void> {
  try {
    const amount = formatPrice(Math.round(payment.amountKop / 100));
    const phone =
      payment.customerPhone || orders[0]?.customerPhone || undefined;
    const email = payment.customerEmail || undefined;

    if (phone) {
      await notify({
        recipientType: "client",
        recipientId: phone,
        event: "payment.succeeded",
        phone,
        email,
        title: "Оплата прошла",
        body: `${amount}. Чек придёт на ваш номер и email.`,
        url: `${siteBase()}/orders?group=${payment.checkoutGroupId}&pay=return`,
        payload: { paymentId: payment.id },
      });
    }

    // Продавцы — по одному на каждый order в группе.
    const seenVendors = new Set<string>();
    for (const o of orders) {
      if (!o.vendorId || seenVendors.has(o.vendorId)) continue;
      seenVendors.add(o.vendorId);
      const vendor = await getVendorById(o.vendorId);
      if (!vendor) continue;
      await notify({
        recipientType: "vendor",
        recipientId: vendor.id,
        event: "payment.succeeded",
        email: vendor.contacts.email,
        phone: vendor.contacts.phone,
        title: `Заказ № ${o.number} оплачен`,
        body: `${formatPrice(o.total)} поступит после удержания комиссии.`,
        url: `${siteBase()}/vendor/dashboard/orders`,
        payload: { paymentId: payment.id, orderId: o.id },
      });
    }
  } catch (e) {
    console.error("[notify:payment.succeeded]", e);
  }
}

/**
 * Возврат оформлен → уведомить клиента.
 */
export async function notifyPaymentRefunded(
  payment: Payment,
  refundedKop: number,
  orders: Order[]
): Promise<void> {
  try {
    const amount = formatPrice(Math.round(refundedKop / 100));
    const phone =
      payment.customerPhone || orders[0]?.customerPhone || undefined;
    if (!phone) return;
    await notify({
      recipientType: "client",
      recipientId: phone,
      event: "payment.refunded",
      phone,
      email: payment.customerEmail || undefined,
      title: "Возврат оформлен",
      body: `${amount} вернётся на карту в течение 3-7 рабочих дней.`,
      url: `${siteBase()}/orders?group=${payment.checkoutGroupId}`,
      payload: { paymentId: payment.id },
    });
  } catch (e) {
    console.error("[notify:payment.refunded]", e);
  }
}

/**
 * Новое обращение в поддержку → уведомить админ-канал.
 */
export async function notifyTicketCreated(ticket: Ticket): Promise<void> {
  try {
    await notify({
      recipientType: "admin",
      recipientId: "platform",
      event: "ticket.created",
      title: `Новое обращение ${ticket.number}`,
      body: `${ticket.subject} · ${ticket.requesterName}`,
      url: `${siteBase()}/admin/tickets/${ticket.id}`,
      payload: { ticketId: ticket.id, priority: ticket.priority },
      channels: ["push"],
    });
  } catch (e) {
    console.error("[notify:ticket.created]", e);
  }
}

/**
 * Ответ в обращении → уведомить противоположную сторону.
 * fromSupport=true → уведомляем клиента; false → уведомляем админа.
 */
export async function notifyTicketReplied(
  ticket: Ticket,
  fromSupport: boolean
): Promise<void> {
  try {
    if (fromSupport) {
      if (!ticket.requesterId || ticket.requesterType === "guest") {
        // Гость не подписан — отправим только по контакту-email, если есть.
        const isEmail = ticket.requesterContact.includes("@");
        await notify({
          recipientType: "client",
          recipientId: ticket.requesterContact,
          event: "ticket.replied",
          email: isEmail ? ticket.requesterContact : undefined,
          phone: isEmail ? undefined : ticket.requesterContact,
          title: `Ответ по обращению ${ticket.number}`,
          body: ticket.subject,
          url: `${siteBase()}/support/tickets/${ticket.id}`,
          payload: { ticketId: ticket.id },
        });
        return;
      }
      await notify({
        recipientType: ticket.requesterType,
        recipientId: ticket.requesterId,
        event: "ticket.replied",
        phone:
          ticket.requesterContact && !ticket.requesterContact.includes("@")
            ? ticket.requesterContact
            : undefined,
        email: ticket.requesterContact.includes("@")
          ? ticket.requesterContact
          : undefined,
        title: `Ответ по обращению ${ticket.number}`,
        body: ticket.subject,
        url: `${siteBase()}/support/tickets/${ticket.id}`,
        payload: { ticketId: ticket.id },
      });
    } else {
      await notify({
        recipientType: "admin",
        recipientId: "platform",
        event: "ticket.replied",
        title: `Ответ клиента в ${ticket.number}`,
        body: ticket.subject,
        url: `${siteBase()}/admin/tickets/${ticket.id}`,
        payload: { ticketId: ticket.id },
        channels: ["push"],
      });
    }
  } catch (e) {
    console.error("[notify:ticket.replied]", e);
  }
}
