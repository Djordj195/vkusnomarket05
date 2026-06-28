import { NextResponse } from "next/server";
import { applyPaymentStatus } from "@/server/payments/payments-actions";

// Demo-callback: используется в preview-режиме без креден ЮKassa.
// Клиент кликает «Оплатить» → редирект сюда → мы переводим платёж в
// succeeded → редирект на returnUrl (страница заказа). В production
// с настоящим YOOKASSA_SHOP_ID этот endpoint не вызывается — клиент
// возвращается напрямую с redirect-странички ЮKassa.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId");
  const returnUrl = url.searchParams.get("returnUrl") || "/market/orders";
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }

  // Prevent open redirect — only allow same-origin relative paths.
  const safeUrl = returnUrl.startsWith("/") && !returnUrl.startsWith("//")
    ? returnUrl
    : "/market/orders";

  await applyPaymentStatus(paymentId, "succeeded", { demo: true });
  return NextResponse.redirect(new URL(safeUrl, url.origin));
}
