"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Minus, Plus, Repeat, ShoppingBasket, Store, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCart } from "@/store/cart";
import type { CartItem, Product, Vendor } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { DELIVERY_FEE } from "@/lib/constants";

type Props = { products: Product[]; vendors: Vendor[] };

type DetailedItem = CartItem & { product: Product };

type VendorGroup = {
  vendor: Vendor | null;
  vendorKey: string;
  items: DetailedItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

const UNKNOWN_VENDOR_KEY = "__unknown__";

export function CartView({ products, vendors }: Props) {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const replaceAll = useCart((s) => s.replaceAll);
  const hydrated = useCart((s) => s.hydrated);
  const searchParams = useSearchParams();
  const isRepeated = searchParams?.get("repeated") === "1";

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
    const result: VendorGroup[] = [];
    for (const [key, bucketItems] of buckets.entries()) {
      const subtotal = bucketItems.reduce(
        (s, it) => s + it.product.price * it.quantity,
        0
      );
      result.push({
        vendorKey: key,
        vendor: key === UNKNOWN_VENDOR_KEY ? null : (vendorMap.get(key) ?? null),
        items: bucketItems,
        subtotal,
        deliveryFee: DELIVERY_FEE,
        total: subtotal + DELIVERY_FEE,
      });
    }
    // продавцы с активными заказами выше; неопознанные (легаси) — в конце
    result.sort((a, b) => {
      if (a.vendorKey === UNKNOWN_VENDOR_KEY) return 1;
      if (b.vendorKey === UNKNOWN_VENDOR_KEY) return -1;
      return (a.vendor?.brandName ?? "").localeCompare(
        b.vendor?.brandName ?? "",
        "ru"
      );
    });
    return result;
  }, [items, productMap, vendorMap]);

  const totalSubtotal = useMemo(
    () => groups.reduce((s, g) => s + g.subtotal, 0),
    [groups]
  );
  const totalDelivery = useMemo(
    () => groups.reduce((s, g) => s + g.deliveryFee, 0),
    [groups]
  );
  const grandTotal = totalSubtotal + totalDelivery;
  const detailedCount = groups.reduce((s, g) => s + g.items.length, 0);

  if (!hydrated) {
    return (
      <PageShell>
        <Header variant="page" title="Корзина" showBack={false} />
      </PageShell>
    );
  }

  if (detailedCount === 0) {
    return (
      <PageShell>
        <Header variant="page" title="Корзина" showBack={false} />
        <EmptyState
          icon={ShoppingBasket}
          title="Корзина пуста"
          description="Добавьте товары из каталога."
          action={
            <Link href="/">
              <Button variant="primary">Перейти в каталог</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  const multiVendor = groups.length > 1;

  return (
    <PageShell>
      <Header
        variant="page"
        title="Корзина"
        showBack={false}
      />

      <div className="px-4 pt-2 pb-4 space-y-3">
        {isRepeated && (
          <div className="flex items-start gap-2 rounded-2xl bg-brand-50 p-3 text-[13px] text-brand-800">
            <Repeat size={18} className="shrink-0 text-brand-600" />
            <span>
              Корзина заполнена из вашего последнего заказа. Можно изменить
              количество, удалить или добавить товары перед оформлением.
            </span>
          </div>
        )}
        {multiVendor && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
            В корзине товары от нескольких продавцов — будет оформлено{" "}
            <b>{groups.length}</b> отдельных заказа. Каждый продавец готовит и
            доставляет свою часть самостоятельно.
          </div>
        )}

        {groups.map((group) => (
          <VendorGroupCard
            key={group.vendorKey}
            group={group}
            onSetQuantity={setQuantity}
            onRemove={remove}
            showDeliveryRow
          />
        ))}

        <div className="rounded-2xl border border-ink-200 p-4">
          <Row label="Товары" value={formatPrice(totalSubtotal)} />
          <Row
            label={
              multiVendor
                ? `Доставка (${groups.length} продавца)`
                : "Доставка"
            }
            value={formatPrice(totalDelivery)}
          />
          <div className="my-2 border-t border-ink-100" />
          <Row label="Итого" value={formatPrice(grandTotal)} bold />
        </div>
      </div>

      <div
        className="fixed bottom-[72px] inset-x-0 z-30 mx-auto max-w-md border-t border-ink-100 bg-white px-3 pt-2 pb-3"
        style={{
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <Link href="/checkout">
          <Button size="lg" fullWidth>
            Оформить{multiVendor ? ` ${groups.length} заказа` : " заказ"} ·{" "}
            {formatPrice(grandTotal)}
          </Button>
        </Link>
        <button
          type="button"
          onClick={clear}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          <Trash2 size={15} />
          Очистить корзину
        </button>
      </div>
    </PageShell>
  );
}

function VendorGroupCard({
  group,
  onSetQuantity,
  onRemove,
  showDeliveryRow,
}: {
  group: VendorGroup;
  onSetQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  showDeliveryRow?: boolean;
}) {
  const vendorName = group.vendor?.brandName ?? "Без продавца";
  const vendorHref = group.vendor ? `/vendor/${group.vendor.slug}` : null;

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-3">
      <header className="mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-ink-100">
          {group.vendor?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={group.vendor.logoUrl}
              alt={vendorName}
              className="h-9 w-9 object-cover"
            />
          ) : (
            <Store size={18} className="text-ink-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {vendorHref ? (
            <Link
              href={vendorHref}
              className="block truncate text-[14px] font-bold text-ink-900 hover:text-brand-700"
            >
              {vendorName}
            </Link>
          ) : (
            <div className="truncate text-[14px] font-bold text-ink-900">
              {vendorName}
            </div>
          )}
          {group.vendor?.shortDescription && (
            <div className="truncate text-[11px] text-ink-500">
              {group.vendor.shortDescription}
            </div>
          )}
        </div>
        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
          {group.items.length}
        </span>
      </header>

      <div className="space-y-2">
        {group.items.map(({ product, quantity }) => (
          <div
            key={product.id}
            className="flex gap-3 rounded-xl bg-ink-50 p-2"
          >
            <Link
              href={`/product/${product.slug}`}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white"
            >
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </Link>
            <div className="flex flex-1 flex-col">
              <Link
                href={`/product/${product.slug}`}
                className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink-900"
              >
                {product.name}
              </Link>
              <div className="mt-0.5 text-[11px] text-ink-500">
                {formatPrice(product.price)} / {product.unit}
              </div>
              <div className="mt-auto flex items-center justify-between pt-1">
                <div className="flex items-center rounded-lg bg-white">
                  <button
                    type="button"
                    aria-label="Уменьшить"
                    onClick={() => onSetQuantity(product.id, quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center text-ink-700 hover:bg-ink-100"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-6 text-center text-[13px] font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Увеличить"
                    onClick={() => onSetQuantity(product.id, quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center text-ink-700 hover:bg-ink-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold text-ink-900">
                    {formatPrice(product.price * quantity)}
                  </span>
                  <button
                    type="button"
                    aria-label="Удалить"
                    onClick={() => onRemove(product.id)}
                    className="flex h-7 w-7 items-center justify-center rounded text-ink-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 border-t border-ink-100 pt-2">
        <Row label="Подытог" value={formatPrice(group.subtotal)} small />
        {showDeliveryRow && (
          <Row
            label="Доставка"
            value={formatPrice(group.deliveryFee)}
            small
          />
        )}
        <Row label="Итого по заказу" value={formatPrice(group.total)} bold />
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  bold,
  small,
}: {
  label: string;
  value: string;
  bold?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span
        className={
          bold
            ? "text-[14px] font-semibold text-ink-900"
            : small
              ? "text-[12px] text-ink-500"
              : "text-[13px] text-ink-600"
        }
      >
        {label}
      </span>
      <span
        className={
          bold
            ? "text-[16px] font-extrabold text-ink-900"
            : small
              ? "text-[12px] text-ink-700"
              : "text-[13px] text-ink-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
