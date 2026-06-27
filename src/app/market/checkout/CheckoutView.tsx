"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  MapPin,
  Store,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useCart } from "@/store/cart";
import { useOrders } from "@/store/orders";
import { useAuth } from "@/store/auth";
import type {
  CartItem,
  DeliveryKind,
  PaymentMethod,
  Product,
  PromoValidation,
  Vendor,
} from "@/lib/types";
import {
  PAYMENT_LABELS,
} from "@/lib/types";
import { PaymentMethodPicker } from "@/components/payment/PaymentMethodPicker";
import {
  cn,
  formatPrice,
  isValidPhone,
  maskPhoneInput,
} from "@/lib/utils";
import { DELIVERY_FEE } from "@/lib/constants";
import { createOrder } from "@/server/orders-actions";
import { createPaymentForCheckoutGroup } from "@/server/payments/payments-actions";
import { validatePromoCodeAction } from "@/server/promo/promo-actions";

type Props = { products: Product[]; vendors: Vendor[] };

type DetailedItem = CartItem & { product: Product };

type VendorGroup = {
  vendor: Vendor | null;
  vendorKey: string;
  items: DetailedItem[];
  subtotal: number;
};

const UNKNOWN_VENDOR_KEY = "__unknown__";

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_TITLES: Record<Step, string> = {
  0: "Контакты и адрес",
  1: "Время доставки",
  2: "Доставка или самовывоз",
  3: "Оплата и комментарий",
  4: "Подтверждение",
};

// Слоты времени, генерируем на ближайшие 2 дня с шагом 2 часа,
// округляя «сейчас» в большую сторону до ближайшего слота.
function buildTimeSlots(): Array<{ value: string; label: string }> {
  const slots: Array<{ value: string; label: string }> = [
    { value: "asap", label: "Как можно скорее" },
  ];
  const now = new Date();
  for (let d = 0; d < 2; d += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    for (let h = 9; h <= 21; h += 2) {
      const start = new Date(day);
      start.setHours(h, 0, 0, 0);
      if (start.getTime() < now.getTime() + 60 * 60 * 1000) continue;
      const end = new Date(start);
      end.setHours(h + 2);
      const dayLabel =
        d === 0 ? "Сегодня" : d === 1 ? "Завтра" : start.toLocaleDateString("ru-RU");
      const hhmm = (n: number) => String(n).padStart(2, "0");
      const label = `${dayLabel} · ${hhmm(start.getHours())}:00–${hhmm(end.getHours())}:00`;
      slots.push({ value: start.toISOString(), label });
    }
  }
  return slots;
}

export function CheckoutView({ products, vendors }: Props) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const replaceAll = useCart((s) => s.replaceAll);
  const hydrated = useCart((s) => s.hydrated);
  const upsertOrder = useOrders((s) => s.upsert);
  const user = useAuth((s) => s.user);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  // Auto-clean stale cart items referencing products that no longer exist
  useEffect(() => {
    if (!hydrated) return;
    const valid = items.filter((i) => productMap.has(i.productId));
    if (valid.length < items.length) {
      replaceAll(valid);
    }
  }, [hydrated, items, productMap, replaceAll]);

  const vendorMap = useMemo(() => {
    const m = new Map<string, Vendor>();
    for (const v of vendors) m.set(v.id, v);
    return m;
  }, [vendors]);

  const groups = useMemo<VendorGroup[]>(() => {
    const buckets = new Map<string, DetailedItem[]>();
    for (const i of items) {
      const product = productMap.get(i.productId);
      if (!product) continue;
      const key = product.vendorId ?? UNKNOWN_VENDOR_KEY;
      const bucket = buckets.get(key) ?? [];
      bucket.push({ ...i, product });
      buckets.set(key, bucket);
    }
    return Array.from(buckets.entries()).map(([key, bucketItems]) => ({
      vendorKey: key,
      vendor: key === UNKNOWN_VENDOR_KEY ? null : (vendorMap.get(key) ?? null),
      items: bucketItems,
      subtotal: bucketItems.reduce(
        (s, it) => s + it.product.price * it.quantity,
        0
      ),
    }));
  }, [items, productMap, vendorMap]);

  const detailedItems = useMemo<DetailedItem[]>(
    () => groups.flatMap((g) => g.items),
    [groups]
  );

  const subtotal = useMemo(
    () => groups.reduce((s, g) => s + g.subtotal, 0),
    [groups]
  );

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState(() => user?.name ?? "");
  const [phone, setPhone] = useState(() =>
    user?.phone ? maskPhoneInput(user.phone) : ""
  );
  const [address, setAddress] = useState("");
  const [deliveryKind, setDeliveryKind] = useState<DeliveryKind>("delivery");
  const [desiredAt, setDesiredAt] = useState<string>("asap");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [comment, setComment] = useState("");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "loading" | "ok" | "denied" | "unsupported"
  >("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeSlots = useMemo(() => buildTimeSlots(), []);

  const deliveryFeePerGroup = deliveryKind === "pickup" ? 0 : DELIVERY_FEE;
  const totalDelivery = deliveryFeePerGroup * groups.length;

  // Phase 11: промокод. При изменении состава корзины / вида доставки предыдущая
  // валидация устаревает, поэтому храним signature и сбрасываем promoApplied в
  // рендере (паттерн «adjusting state during render» из доки React).
  const cartSignature = useMemo(
    () =>
      `${deliveryKind}|${items
        .map((i) => `${i.productId}:${i.quantity}`)
        .sort()
        .join(",")}`,
    [items, deliveryKind]
  );
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<
    Extract<PromoValidation, { ok: true }> | null
  >(null);
  const [promoSignature, setPromoSignature] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  if (promoApplied && promoSignature !== null && promoSignature !== cartSignature) {
    setPromoApplied(null);
    setPromoSignature(null);
    setPromoError(null);
  }

  const promoDiscount = promoApplied?.totalDiscount ?? 0;
  const grandTotal = Math.max(0, subtotal + totalDelivery - promoDiscount);

  const applyPromo = async () => {
    setPromoError(null);
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Введите промокод.");
      return;
    }
    setPromoBusy(true);
    try {
      const result = await validatePromoCodeAction({
        code,
        customerPhone: phone || (user?.phone ?? null),
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        deliveryKind,
      });
      if (!result.ok) {
        setPromoApplied(null);
        setPromoSignature(null);
        setPromoError(result.error);
      } else {
        setPromoApplied(result);
        setPromoSignature(cartSignature);
        setPromoError(null);
      }
    } catch (err) {
      console.error(err);
      setPromoError("Не удалось проверить промокод.");
    } finally {
      setPromoBusy(false);
    }
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoSignature(null);
    setPromoError(null);
    setPromoInput("");
  };

  useEffect(() => {
    if (hydrated && items.length === 0 && !submitting) {
      router.replace("/market/cart");
    }
  }, [hydrated, items.length, submitting, router]);

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

  const canGoNext = (): boolean => {
    setError(null);
    if (step === 0) {
      if (!name.trim()) {
        setError("Укажите имя.");
        return false;
      }
      if (!isValidPhone(phone)) {
        setError("Укажите корректный номер (+7...).");
        return false;
      }
      if (deliveryKind === "delivery" && !address.trim()) {
        setError("Укажите адрес доставки или выберите самовывоз.");
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!canGoNext()) return;
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => (s > 0 ? ((s - 1) as Step) : s));
  };

  const onSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError("Укажите имя.");
    if (!isValidPhone(phone))
      return setError("Укажите корректный номер (+7...).");
    if (deliveryKind === "delivery" && !address.trim())
      return setError("Укажите адрес доставки.");

    setSubmitting(true);
    try {
      const result = await createOrder({
        customerName: name,
        customerPhone: phone,
        address: deliveryKind === "delivery" ? address : "",
        comment: comment || undefined,
        payment,
        geo: geo ?? undefined,
        deliveryKind,
        desiredAt: desiredAt === "asap" ? null : desiredAt,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        promoCode: promoApplied?.promo.code ?? null,
      });

      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      for (const order of result.orders) {
        upsertOrder(order);
      }
      clearCart();

      // Phase 8: для онлайн-оплаты создаём платёж в ЮKassa и редиректим
      // клиента на confirmation_url. После оплаты он вернётся на /orders
      // с ?pay=return — там покажется статус.
      if (payment !== "cash") {
        const pay = await createPaymentForCheckoutGroup({
          checkoutGroupId: result.groupId,
          customerPhone: phone,
          method: payment,
        });
        if (!pay.ok) {
          setError(`Платёж не создан: ${pay.error}`);
          setSubmitting(false);
          return;
        }
        if (pay.payment.confirmationUrl) {
          window.location.href = pay.payment.confirmationUrl;
          return;
        }
        // Фолбэк: confirmation_url не пришёл — отправляем на /orders.
        router.replace(`/market/orders?group=${result.groupId}&pay=pending`);
        return;
      }

      // Cash: сразу на страницу заказа.
      if (result.orders.length === 1) {
        router.replace(`/market/orders/${result.orders[0].id}?new=1`);
      } else {
        router.replace(`/market/orders?group=${result.groupId}&new=1`);
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось оформить заказ. Попробуйте ещё раз.");
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <Header variant="page" title="Оформление" showBack />

      <Stepper currentStep={step} onBack={step > 0 ? goBack : null} />

      <div className="px-4 pt-3 pb-32 space-y-4">
        {step === 0 && (
          <ContactsAndAddressStep
            name={name}
            setName={setName}
            phone={phone}
            setPhone={setPhone}
            deliveryKind={deliveryKind}
            setDeliveryKind={setDeliveryKind}
            address={address}
            setAddress={setAddress}
            comment={comment}
            setComment={setComment}
            geoStatus={geoStatus}
            requestGeo={requestGeo}
          />
        )}

        {step === 1 && (
          <TimeStep
            slots={timeSlots}
            value={desiredAt}
            onChange={setDesiredAt}
          />
        )}

        {step === 2 && (
          <DeliveryStep
            deliveryKind={deliveryKind}
            setDeliveryKind={setDeliveryKind}
            groups={groups}
            address={address}
          />
        )}

        {step === 3 && (
          <PaymentStep
            payment={payment}
            setPayment={setPayment}
            comment={comment}
            setComment={setComment}
          />
        )}

        {step === 4 && (
          <ConfirmStep
            name={name}
            phone={phone}
            address={address}
            deliveryKind={deliveryKind}
            desiredAt={desiredAt}
            timeSlots={timeSlots}
            payment={payment}
            comment={comment}
            groups={groups}
            deliveryFeePerGroup={deliveryFeePerGroup}
            subtotal={subtotal}
            totalDelivery={totalDelivery}
            grandTotal={grandTotal}
            promoInput={promoInput}
            setPromoInput={setPromoInput}
            promoApplied={promoApplied}
            promoError={promoError}
            promoBusy={promoBusy}
            applyPromo={applyPromo}
            removePromo={removePromo}
          />
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 p-3 text-[13px] text-red-700">
            {error}
          </div>
        )}
      </div>

      <div
        className="fixed bottom-[72px] inset-x-0 z-30 mx-auto max-w-md md:max-w-2xl lg:max-w-5xl border-t border-ink-100 bg-white p-3"
        style={{
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="mb-1 flex items-center justify-between text-[12px] text-ink-500">
          <span>Шаг {step + 1} из 5</span>
          <span>
            Итого:{" "}
            <b className="text-ink-900">{formatPrice(grandTotal)}</b>
            {detailedItems.length > 0 && (
              <> · {groups.length > 1 ? `${groups.length} заказа` : "1 заказ"}</>
            )}
          </span>
        </div>
        {step < 4 ? (
          <Button size="lg" fullWidth onClick={goNext}>
            Далее
          </Button>
        ) : (
          <Button
            size="lg"
            fullWidth
            disabled={submitting}
            onClick={onSubmit}
          >
            {submitting
              ? "Оформляем..."
              : `Подтвердить · ${formatPrice(grandTotal)}`}
          </Button>
        )}
      </div>
    </PageShell>
  );
}

function Stepper({
  currentStep,
  onBack,
}: {
  currentStep: Step;
  onBack: (() => void) | null;
}) {
  const steps: Step[] = [0, 1, 2, 3, 4];
  return (
    <div className="px-4 pt-1">
      <div className="flex items-center gap-1.5">
        {steps.map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              s <= currentStep ? "bg-brand-500" : "bg-ink-200"
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-[12px] font-semibold text-ink-700">
          {STEP_TITLES[currentStep]}
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:text-brand-800"
          >
            <ChevronLeft size={14} /> Назад
          </button>
        )}
      </div>
    </div>
  );
}

function ContactsAndAddressStep({
  name,
  setName,
  phone,
  setPhone,
  deliveryKind,
  setDeliveryKind,
  address,
  setAddress,
  comment,
  setComment,
  geoStatus,
  requestGeo,
}: {
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  deliveryKind: DeliveryKind;
  setDeliveryKind: (v: DeliveryKind) => void;
  address: string;
  setAddress: (v: string) => void;
  comment: string;
  setComment: (v: string) => void;
  geoStatus: "idle" | "loading" | "ok" | "denied" | "unsupported";
  requestGeo: () => void;
}) {
  return (
    <>
      <Section title="Контактные данные">
        <Input
          label="Ваше имя"
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

      {deliveryKind === "delivery" && (
        <Section title="Адрес доставки">
          <Textarea
            label="Адрес"
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
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
        </Section>
      )}

      <Section title="Тип получения">
        <div className="grid grid-cols-2 gap-2">
          <SelectableTile
            active={deliveryKind === "delivery"}
            onClick={() => setDeliveryKind("delivery")}
            icon={<Truck size={20} />}
            title="Доставка"
            subtitle="Привезём по адресу"
          />
          <SelectableTile
            active={deliveryKind === "pickup"}
            onClick={() => setDeliveryKind("pickup")}
            icon={<Store size={20} />}
            title="Самовывоз"
            subtitle="Заберу у продавца"
          />
        </div>
      </Section>
    </>
  );
}

function TimeStep({
  slots,
  value,
  onChange,
}: {
  slots: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Section title="Когда удобно получить">
      <div className="space-y-2">
        {slots.map((slot) => (
          <button
            type="button"
            key={slot.value}
            onClick={() => onChange(slot.value)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-colors",
              value === slot.value
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 bg-white hover:bg-ink-50"
            )}
          >
            <span className="text-[14px] font-semibold text-ink-900">
              {slot.label}
            </span>
            {value === slot.value && (
              <Check size={18} className="text-brand-600" />
            )}
          </button>
        ))}
      </div>
    </Section>
  );
}

function DeliveryStep({
  deliveryKind,
  setDeliveryKind,
  groups,
  address,
}: {
  deliveryKind: DeliveryKind;
  setDeliveryKind: (v: DeliveryKind) => void;
  groups: VendorGroup[];
  address: string;
}) {
  return (
    <>
      <Section title="Доставка или самовывоз">
        <div className="grid grid-cols-2 gap-2">
          <SelectableTile
            active={deliveryKind === "delivery"}
            onClick={() => setDeliveryKind("delivery")}
            icon={<Truck size={20} />}
            title="Доставка"
            subtitle={`+${formatPrice(DELIVERY_FEE)} за продавца`}
          />
          <SelectableTile
            active={deliveryKind === "pickup"}
            onClick={() => setDeliveryKind("pickup")}
            icon={<Store size={20} />}
            title="Самовывоз"
            subtitle="Бесплатно"
          />
        </div>
        {deliveryKind === "delivery" && address && (
          <div className="rounded-2xl bg-ink-50 p-3 text-[13px] text-ink-700">
            <div className="text-[11px] uppercase tracking-wide text-ink-500">
              Адрес
            </div>
            <div className="mt-0.5">{address}</div>
          </div>
        )}
      </Section>

      {groups.length > 1 && (
        <Section title={`Продавцы (${groups.length})`}>
          <div className="rounded-2xl bg-amber-50 p-3 text-[12px] text-amber-800">
            Будет оформлено <b>{groups.length}</b> отдельных заказа. Каждый
            продавец готовит и {deliveryKind === "delivery" ? "доставляет" : "выдаёт"} свою часть самостоятельно.
          </div>
          <div className="space-y-2">
            {groups.map((g) => (
              <div
                key={g.vendorKey}
                className="flex items-center justify-between rounded-2xl border border-ink-200 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-ink-900">
                    {g.vendor?.brandName ?? "Без продавца"}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    {g.items.length} позиции · {formatPrice(g.subtotal)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-ink-500">
                    {deliveryKind === "delivery" ? "Доставка" : "Самовывоз"}
                  </div>
                  <div className="text-[13px] font-bold text-ink-900">
                    {deliveryKind === "delivery"
                      ? formatPrice(DELIVERY_FEE)
                      : formatPrice(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function paymentHint(payment: PaymentMethod): string {
  switch (payment) {
    case "cash":
      return "Оплатите заказ наличными курьеру при получении.";
    case "sbp":
      return "После подтверждения откроется QR-код или приложение вашего банка. Оплата проходит мгновенно.";
    case "card":
      return "После подтверждения вас перенаправит на защищённую страницу ЮKassa для ввода данных карты.";
    case "mirpay":
    case "alfapay":
      return "После подтверждения откроется страница ЮKassa, где можно выбрать нужный способ оплаты.";
    default:
      return "После подтверждения вас перенаправит на защищённую страницу ЮKassa для завершения оплаты.";
  }
}

function PaymentStep({
  payment,
  setPayment,
  comment,
  setComment,
}: {
  payment: PaymentMethod;
  setPayment: (v: PaymentMethod) => void;
  comment: string;
  setComment: (v: string) => void;
}) {
  return (
    <>
      <Section title="Способ оплаты">
        <PaymentMethodPicker value={payment} onChange={setPayment} />
        <p className="text-[11px] text-ink-500">
          {paymentHint(payment)}{" "}
          {payment !== "cash" && "Чек 54-ФЗ выдаётся автоматически. "}
          <Link href="/legal" className="underline">
            54-ФЗ / реквизиты
          </Link>
        </p>
      </Section>

      <Section title="Комментарий">
        <Textarea
          label="Пожелания продавцу или курьеру (необязательно)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </Section>
    </>
  );
}

function ConfirmStep({
  name,
  phone,
  address,
  deliveryKind,
  desiredAt,
  timeSlots,
  payment,
  comment,
  groups,
  deliveryFeePerGroup,
  subtotal,
  totalDelivery,
  grandTotal,
  promoInput,
  setPromoInput,
  promoApplied,
  promoError,
  promoBusy,
  applyPromo,
  removePromo,
}: {
  name: string;
  phone: string;
  address: string;
  deliveryKind: DeliveryKind;
  desiredAt: string;
  timeSlots: Array<{ value: string; label: string }>;
  payment: PaymentMethod;
  comment: string;
  groups: VendorGroup[];
  deliveryFeePerGroup: number;
  subtotal: number;
  totalDelivery: number;
  grandTotal: number;
  promoInput: string;
  setPromoInput: (v: string) => void;
  promoApplied: Extract<PromoValidation, { ok: true }> | null;
  promoError: string | null;
  promoBusy: boolean;
  applyPromo: () => void;
  removePromo: () => void;
}) {
  const slotLabel =
    timeSlots.find((s) => s.value === desiredAt)?.label ?? desiredAt;

  return (
    <>
      <Section title="Сводка по заказу">
        <SummaryRow label="Имя" value={name} />
        <SummaryRow label="Телефон" value={phone} />
        <SummaryRow
          label="Получение"
          value={deliveryKind === "delivery" ? "Доставка курьером" : "Самовывоз"}
        />
        {deliveryKind === "delivery" && address && (
          <SummaryRow label="Адрес" value={address} />
        )}
        <SummaryRow label="Время" value={slotLabel} />
        <SummaryRow
          label="Оплата"
          value={PAYMENT_LABELS[payment]}
        />
        {comment && <SummaryRow label="Комментарий" value={comment} />}
      </Section>

      <Section
        title={
          groups.length > 1
            ? `Будет оформлено ${groups.length} заказа`
            : "Состав заказа"
        }
      >
        <div className="space-y-3">
          {groups.map((g) => {
            const groupTotal = g.subtotal + deliveryFeePerGroup;
            return (
              <div
                key={g.vendorKey}
                className="rounded-2xl border border-ink-200 p-3"
              >
                <div className="mb-2 text-[13px] font-bold text-ink-900">
                  {g.vendor?.brandName ?? "Без продавца"}
                </div>
                <ul className="space-y-1 text-[12px] text-ink-700">
                  {g.items.map(({ product, quantity }) => (
                    <li
                      key={product.id}
                      className="flex justify-between gap-2"
                    >
                      <span className="truncate">
                        {product.name} × {quantity}
                      </span>
                      <span className="shrink-0 font-semibold text-ink-900">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 border-t border-ink-100 pt-2 space-y-1 text-[12px]">
                  <Row label="Подытог" value={formatPrice(g.subtotal)} />
                  <Row
                    label={
                      deliveryKind === "delivery" ? "Доставка" : "Самовывоз"
                    }
                    value={formatPrice(deliveryFeePerGroup)}
                  />
                  <Row label="Итого" value={formatPrice(groupTotal)} bold />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Промокод">
        {promoApplied ? (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Tag className="mt-0.5 size-4 text-emerald-600" />
                <div>
                  <div className="text-[14px] font-semibold text-emerald-900">
                    {promoApplied.promo.code}
                  </div>
                  {promoApplied.promo.description ? (
                    <div className="text-[12px] text-emerald-800">
                      {promoApplied.promo.description}
                    </div>
                  ) : null}
                  <div className="mt-1 text-[12px] font-semibold text-emerald-800">
                    Скидка: −{formatPrice(promoApplied.totalDiscount)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={removePromo}
                aria-label="Убрать промокод"
                className="rounded-full p-1.5 text-emerald-700 hover:bg-emerald-100"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <Input
                placeholder="Введите промокод"
                value={promoInput}
                onChange={(e) =>
                  setPromoInput(e.target.value.toUpperCase())
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyPromo();
                  }
                }}
                aria-label="Промокод"
                disabled={promoBusy}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={applyPromo}
                disabled={promoBusy || !promoInput.trim()}
              >
                {promoBusy ? "Проверяем…" : "Применить"}
              </Button>
            </div>
            {promoError && (
              <div className="mt-2 text-[12px] text-red-700">{promoError}</div>
            )}
          </div>
        )}
      </Section>

      <Section title="К оплате">
        <div className="rounded-2xl bg-brand-50 p-3 space-y-1 text-[14px]">
          <Row label="Товары" value={formatPrice(subtotal)} />
          <Row
            label={
              deliveryKind === "delivery"
                ? `Доставка (${groups.length} продавца)`
                : "Самовывоз"
            }
            value={formatPrice(totalDelivery)}
          />
          {promoApplied && promoApplied.totalDiscount > 0 ? (
            <Row
              label={`Скидка (${promoApplied.promo.code})`}
              value={`−${formatPrice(promoApplied.totalDiscount)}`}
            />
          ) : null}
          <Row label="Итого" value={formatPrice(grandTotal)} bold />
        </div>
      </Section>
    </>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[13px]">
      <span className="text-ink-500">{label}</span>
      <span className="text-right font-semibold text-ink-900">{value}</span>
    </div>
  );
}

function SelectableTile({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors",
        active ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-white"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          active ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-700"
        )}
      >
        {icon}
      </span>
      <span className="text-[14px] font-bold text-ink-900">{title}</span>
      <span className="text-[11px] text-ink-500">{subtitle}</span>
    </button>
  );
}
