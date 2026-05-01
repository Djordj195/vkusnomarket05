"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, ShieldCheck, Wallet } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useCart } from "@/store/cart";
import { useOrders } from "@/store/orders";
import { useAuth } from "@/store/auth";
import { formatPrice, isValidPhone, maskPhoneInput } from "@/lib/utils";
import { DELIVERY_FEE, MIN_ORDER_AMOUNT } from "@/lib/constants";
import {
  PAYMENT_LABELS,
  type PaymentMethod,
  type Order,
} from "@/lib/types";
import { createOrder } from "@/server/orders-actions";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const detailedItems = useCart((s) => s.detailedItems());
  const subtotal = useCart((s) => s.subtotal());
  const clearCart = useCart((s) => s.clear);
  const hydrated = useCart((s) => s.hydrated);
  const addOrder = useOrders((s) => s.add);
  const user = useAuth((s) => s.user);

  const [name, setName] = useState(() => user?.name ?? "");
  const [phone, setPhone] = useState(() =>
    user?.phone ? maskPhoneInput(user.phone) : ""
  );
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "loading" | "ok" | "denied" | "unsupported"
  >("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && items.length === 0 && !submitting) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, submitting, router]);

  const total = subtotal + DELIVERY_FEE;
  const belowMin = subtotal < MIN_ORDER_AMOUNT;

  const requestGeo = () => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Укажите имя.");
    if (!isValidPhone(phone))
      return setError("Укажите корректный номер (+7...).");
    if (!address.trim()) return setError("Укажите адрес доставки.");
    if (belowMin)
      return setError(`Минимальный заказ — ${formatPrice(MIN_ORDER_AMOUNT)}.`);

    setSubmitting(true);
    try {
      const result = await createOrder({
        customerName: name,
        customerPhone: phone,
        address,
        comment: comment || undefined,
        payment,
        geo: geo ?? undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      const order: Order = result.order;
      addOrder(order);
      clearCart();
      router.replace(`/orders/${order.id}?new=1`);
    } catch (err) {
      console.error(err);
      setError("Не удалось оформить заказ. Попробуйте ещё раз.");
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <Header variant="page" title="Оформление заказа" showBack />
      <form onSubmit={onSubmit} className="px-4 pt-2 pb-32 space-y-5">
        <Section title="Контактные данные">
          <Input
            label="Ваше имя"
            placeholder="Например, Артур"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
          />
          <Input
            label="Телефон"
            placeholder="+7 (___) ___-__-__"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
            autoComplete="tel"
          />
        </Section>

        <Section title="Адрес доставки">
          <Textarea
            label="Адрес"
            placeholder="ул. Советская, дом 12, кв. 5, подъезд 2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
          />
          <button
            type="button"
            onClick={requestGeo}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold transition-colors",
              geoStatus === "ok"
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
            )}
          >
            <MapPin size={16} />
            {geoStatus === "ok"
              ? "Геолокация передана курьеру"
              : geoStatus === "loading"
              ? "Определяем..."
              : geoStatus === "denied"
              ? "Доступ к геолокации запрещён"
              : geoStatus === "unsupported"
              ? "Геолокация недоступна"
              : "Прикрепить геолокацию"}
          </button>
          <Textarea
            label="Комментарий курьеру (необязательно)"
            placeholder="Например, домофон не работает"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
        </Section>

        <Section title="Способ оплаты">
          <div className="space-y-2">
            <PaymentOption
              checked={payment === "cash"}
              onClick={() => setPayment("cash")}
              label={PAYMENT_LABELS.cash}
              hint="Курьер привезёт сдачу"
              icon={<Wallet size={20} />}
            />
            <PaymentOption
              checked={payment === "card"}
              onClick={() => setPayment("card")}
              label={PAYMENT_LABELS.card}
              hint="Оплата картой подключается отдельно"
              disabled
              icon={<ShieldCheck size={20} />}
            />
          </div>
        </Section>

        <Section title="Состав заказа">
          <ul className="space-y-1.5 text-[13px] text-ink-700">
            {detailedItems.map(({ product, quantity }) => (
              <li key={product.id} className="flex justify-between gap-2">
                <span className="truncate">
                  {product.name} × {quantity}
                </span>
                <span className="shrink-0 font-semibold text-ink-900">
                  {formatPrice(product.price * quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-ink-100 pt-3 space-y-1.5 text-[14px]">
            <Row label="Товары" value={formatPrice(subtotal)} />
            <Row label="Доставка" value={formatPrice(DELIVERY_FEE)} />
            <Row label="Итого" value={formatPrice(total)} bold />
          </div>
        </Section>

        {error && (
          <div className="rounded-2xl bg-red-50 p-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <p className="text-[11px] leading-snug text-ink-500">
          Нажимая «Оформить заказ», вы соглашаетесь с условиями доставки.
          После оформления заказ появится в разделе «Заказы».
        </p>

        <div
          className="fixed bottom-[72px] inset-x-0 z-30 mx-auto max-w-md border-t border-ink-100 bg-white p-3"
          style={{
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={submitting || belowMin}
          >
            {submitting
              ? "Оформляем..."
              : `Оформить заказ · ${formatPrice(total)}`}
          </Button>
          {belowMin && (
            <Link
              href="/"
              className="mt-2 block text-center text-[12px] text-ink-500"
            >
              Минимальный заказ {formatPrice(MIN_ORDER_AMOUNT)} — добавьте товары
            </Link>
          )}
        </div>
      </form>
    </PageShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-[15px] font-bold text-ink-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
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

function PaymentOption({
  checked,
  onClick,
  label,
  hint,
  icon,
  disabled,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
        checked
          ? "border-brand-500 bg-brand-50"
          : "border-ink-200 bg-white",
        disabled && "opacity-60"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          checked ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-700"
        )}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[14px] font-semibold text-ink-900">
          {label}
        </span>
        {hint && (
          <span className="block text-[12px] text-ink-500">{hint}</span>
        )}
      </span>
      <span
        className={cn(
          "h-5 w-5 rounded-full border-2",
          checked
            ? "border-brand-500 bg-brand-500"
            : "border-ink-300 bg-white"
        )}
      >
        {checked && (
          <span className="block h-full w-full scale-50 rounded-full bg-white" />
        )}
      </span>
    </button>
  );
}
