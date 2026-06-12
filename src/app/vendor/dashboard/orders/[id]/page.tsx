import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";
import { getCurrentVendor } from "@/server/vendor-auth";
import { getOrderById } from "@/server/orders-store";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  DELIVERY_KIND_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  type OrderStatus,
} from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { VendorOrderActions } from "./VendorOrderActions";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

const statusTone: Record<
  OrderStatus,
  "warn" | "info" | "accent" | "success" | "danger"
> = {
  accepted: "info",
  preparing: "warn",
  courier: "accent",
  delivered: "success",
  cancelled: "danger",
};

export default async function VendorOrderDetailPage({ params }: PageProps) {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vendor/login");

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || order.vendorId !== vendor.id) notFound();

  const deliveryLabel = order.deliveryKind
    ? DELIVERY_KIND_LABELS[order.deliveryKind]
    : "Доставка";

  return (
    <div className="space-y-4">
      <Link
        href="/vendor/dashboard/orders"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-800"
      >
        <ChevronLeft size={14} />К списку заказов
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-ink-900">
            Заказ № {order.number}
          </h1>
          <p className="text-[12px] text-ink-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge tone={statusTone[order.status]}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </header>

      <VendorOrderActions orderId={order.id} currentStatus={order.status} />

      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="mb-3 text-[15px] font-bold text-ink-900">
          Состав заказа
        </h2>
        <ul className="space-y-2">
          {order.items.map((it) => (
            <li
              key={it.productId}
              className="flex items-center gap-3 rounded-xl bg-ink-50 p-3"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                <Image
                  src={it.image}
                  alt={it.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-ink-900">
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
        <div className="mt-4 space-y-1 border-t border-ink-100 pt-3 text-[13px]">
          <SummaryRow label="Товары" value={formatPrice(order.subtotal)} />
          <SummaryRow label="Доставка" value={formatPrice(order.deliveryFee)} />
          {order.discountTotal ? (
            <SummaryRow
              label={`Скидка${order.promoCode ? ` (${order.promoCode})` : ""}`}
              value={`−${formatPrice(order.discountTotal)}`}
            />
          ) : null}
          <SummaryRow label="Итого" value={formatPrice(order.total)} bold />
        </div>
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        <h2 className="mb-3 text-[15px] font-bold text-ink-900">
          Клиент и доставка
        </h2>
        <ul className="space-y-2.5 text-[13px]">
          <InfoRow
            icon={<User size={14} />}
            label="Имя"
            value={order.customerName}
          />
          <InfoRow
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
          {order.address ? (
            <InfoRow
              icon={<MapPin size={14} />}
              label="Адрес"
              value={order.address}
            />
          ) : null}
          {order.geo ? (
            <InfoRow
              icon={<MapPin size={14} />}
              label="На карте"
              value={
                <a
                  href={`https://maps.yandex.ru/?pt=${order.geo.lng},${order.geo.lat}&z=17&l=map`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:text-brand-700"
                >
                  Открыть Яндекс.Карты
                </a>
              }
            />
          ) : null}
          <InfoRow
            icon={<CreditCard size={14} />}
            label="Оплата"
            value={PAYMENT_LABELS[order.payment]}
          />
          <InfoRow
            icon={<Clock size={14} />}
            label="Доставка"
            value={deliveryLabel}
          />
          {order.desiredAt ? (
            <InfoRow
              icon={<Clock size={14} />}
              label="Желаемое время"
              value={formatDate(order.desiredAt)}
            />
          ) : null}
          {order.comment ? (
            <InfoRow
              icon={<MessageSquare size={14} />}
              label="Комментарий"
              value={order.comment}
            />
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function SummaryRow({
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
          bold ? "text-[14px] font-semibold text-ink-900" : "text-ink-600"
        }
      >
        {label}
      </span>
      <span
        className={
          bold ? "text-[16px] font-extrabold text-ink-900" : "text-ink-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

function InfoRow({
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
