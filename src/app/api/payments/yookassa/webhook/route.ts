import { NextResponse } from "next/server";
import { handleYookassaWebhook } from "@/server/payments/payments-actions";

// ЮKassa отправляет webhook'и сюда. См.
// https://yookassa.ru/developers/using-api/webhooks
//
// Подпись запроса ЮKassa проверяется по IP whitelist (ip-список выдаётся
// поддержкой при включении вебхуков). На уровне приложения мы выполняем
// идемпотентную обработку (поиск платежа по providerPaymentId).
//
// Принимаемые события:
//   - payment.succeeded
//   - payment.waiting_for_capture
//   - payment.canceled
//   - refund.succeeded (опц.)
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("event" in body) ||
    !("object" in body)
  ) {
    return NextResponse.json({ error: "invalid shape" }, { status: 400 });
  }

  const event = String((body as { event: unknown }).event);
  const object = (body as { object: { id?: unknown; status?: unknown } }).object;
  if (!object || typeof object.id !== "string") {
    return NextResponse.json({ error: "missing object.id" }, { status: 400 });
  }

  // refund.succeeded мы пока обрабатываем как просто аудит-событие —
  // полную синхронизацию статусов делает refundPaymentAction (для админских
  // refund'ов). Если refund прилетел не от нашего кода (внешняя кнопка),
  // на текущей фазе помечаем только audit; синхронизация суммы — в Phase 8.5.
  if (event.startsWith("refund.")) {
    // fall-through: handle via webhook handler too (it still updates audit)
  }

  const res = await handleYookassaWebhook(body as {
    event: string;
    object: {
      id: string;
      status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
      paid?: boolean;
      metadata?: Record<string, string>;
    };
  });
  // ЮKassa требует 200 OK на принятые события. На ошибку поиска платежа
  // также возвращаем 200, иначе она будет ретраиться бесконечно.
  if (!res.ok) {
    return NextResponse.json({ accepted: false, error: res.error }, { status: 200 });
  }
  return NextResponse.json({ accepted: true });
}
