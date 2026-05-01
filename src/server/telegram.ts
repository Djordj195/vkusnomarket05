import "server-only";
import type { Order } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function notifyAdminNewOrder(order: Order): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    // Telegram не настроен — это нормально для разработки.
    // Подключите токен и chat id через .env.
    return;
  }
  const lines: string[] = [];
  lines.push(`<b>🛒 Новый заказ ${order.number}</b>`);
  lines.push("");
  lines.push(`<b>Клиент:</b> ${escape(order.customerName)}`);
  lines.push(`<b>Телефон:</b> ${escape(order.customerPhone)}`);
  lines.push(`<b>Адрес:</b> ${escape(order.address)}`);
  if (order.comment) lines.push(`<b>Комментарий:</b> ${escape(order.comment)}`);
  if (order.geo) {
    lines.push(
      `<b>Геолокация:</b> https://maps.yandex.ru/?pt=${order.geo.lng},${order.geo.lat}&z=17&l=map`
    );
  }
  lines.push("");
  lines.push("<b>Состав:</b>");
  for (const it of order.items) {
    lines.push(
      `• ${escape(it.name)} — ${it.quantity} × ${formatPrice(it.price)} = ${formatPrice(it.price * it.quantity)}`
    );
  }
  lines.push("");
  lines.push(`<b>Товары:</b> ${formatPrice(order.subtotal)}`);
  lines.push(`<b>Доставка:</b> ${formatPrice(order.deliveryFee)}`);
  lines.push(`<b>Итого:</b> ${formatPrice(order.total)}`);
  lines.push(
    `<b>Оплата:</b> ${order.payment === "cash" ? "Наличными" : "Картой"}`
  );
  lines.push(`<b>Статус:</b> ${ORDER_STATUS_LABELS[order.status]}`);

  await fetch(
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
  ).catch((e) => {
    // Не валим заказ из-за упавшего Telegram.
    console.error("Telegram notify failed:", e);
  });
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
