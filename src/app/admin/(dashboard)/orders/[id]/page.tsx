import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Phone, User } from "lucide-react";
import { getOrderById } from "@/server/orders-store";
import { listCouriers } from "@/server/couriers-store";
import { formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { OrderStatusControls } from "./OrderStatusControls";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const couriers = await listCouriers();

  return (
    <div className="space-y-5">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-800"
      >
        <ChevronLeft size={14} />К списку заказов
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-ink-900">
            Заказ № {order.number}
          </h1>
          <p className="text-[13px] text-ink-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge tone="brand">{ORDER_STATUS_LABELS[order.status]}</Badge>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="mb-3 text-[15px] font-bold text-ink-900">
              Состав заказа
            </h2>
            <ul className="space-y-2">
              {order.items.map((it) => (
                <li
                  key={it.productId}
                  className="flex items-center gap-3 rounded-xl bg-ink-50 p-3"
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white">
                    <Image
                      src={it.image}
                      alt={it.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[14px] font-semibold text-ink-900">
                      {it.name}
                    </div>
                    <div className="text-[12px] text-ink-500">
                      {it.quantity} × {formatPrice(it.price)} / {it.unit}
                    </div>
                  </div>
                  <div className="text-[14px] font-bold text-ink-900">
                    {formatPrice(it.price * it.quantity)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-[13px]">
              <Row label="Товары" value={formatPrice(order.subtotal)} />
              <Row label="Доставка" value={formatPrice(order.deliveryFee)} />
              <Row label="Итого" value={formatPrice(order.total)} bold />
            </div>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="mb-3 text-[15px] font-bold text-ink-900">
              Контакты и адрес
            </h2>
            <ul className="space-y-2 text-[13px]">
              <Field icon={<User size={14} />} label="Имя" value={order.customerName} />
              <Field
                icon={<Phone size={14} />}
                label="Телефон"
                value={
                  <a
                    href={`tel:${order.customerPhone.replace(/[^+\d]/g, "")}`}
                    className="text-brand-600 hover:text-brand-700"
                  >
                    {order.customerPhone}
                  </a>
                }
              />
              <Field
                icon={<MapPin size={14} />}
                label="Адрес"
                value={order.address}
              />
              {order.geo && (
                <Field
                  icon={<MapPin size={14} />}
                  label="Геолокация"
                  value={
                    <a
                      href={`https://maps.yandex.ru/?pt=${order.geo.lng},${order.geo.lat}&z=17&l=map`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-700"
                    >
                      Открыть на карте
                    </a>
                  }
                />
              )}
              {order.comment && (
                <Field
                  icon={<MapPin size={14} />}
                  label="Комментарий"
                  value={order.comment}
                />
              )}
              <Field
                icon={<MapPin size={14} />}
                label="Оплата"
                value={
                  order.payment === "cash"
                    ? PAYMENT_LABELS.cash
                    : PAYMENT_LABELS.card
                }
              />
            </ul>
          </div>
        </div>

        <OrderStatusControls
          orderId={order.id}
          currentStatus={order.status}
          currentCourierId={order.courierId}
          couriers={couriers}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={
          bold ? "text-[15px] font-semibold text-ink-900" : "text-ink-600"
        }
      >
        {label}
      </span>
      <span
        className={
          bold ? "text-[18px] font-extrabold text-ink-900" : "text-ink-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex items-start justify-between gap-2">
      <span className="flex items-center gap-1.5 text-ink-500">
        {icon}
        {label}
      </span>
      <span className="text-right text-ink-900">{value}</span>
    </li>
  );
}
