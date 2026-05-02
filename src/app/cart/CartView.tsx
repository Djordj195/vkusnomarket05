"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCart } from "@/store/cart";
import type { CartItem, Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { DELIVERY_FEE, MIN_ORDER_AMOUNT } from "@/lib/constants";

type Props = { products: Product[] };

export function CartView({ products }: Props) {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const hydrated = useCart((s) => s.hydrated);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const detailedItems = useMemo<Array<CartItem & { product: Product }>>(
    () =>
      items
        .map((i) => {
          const product = productMap.get(i.productId);
          return product ? { ...i, product } : null;
        })
        .filter((x): x is CartItem & { product: Product } => x !== null),
    [items, productMap]
  );
  const subtotal = useMemo(
    () =>
      detailedItems.reduce(
        (sum, { product, quantity }) => sum + product.price * quantity,
        0
      ),
    [detailedItems]
  );

  if (!hydrated) {
    return (
      <PageShell>
        <Header variant="page" title="Корзина" showBack={false} />
      </PageShell>
    );
  }

  if (detailedItems.length === 0) {
    return (
      <PageShell>
        <Header variant="page" title="Корзина" showBack={false} />
        <EmptyState
          icon={ShoppingBasket}
          title="Корзина пуста"
          description="Добавьте товары из каталога. Минимальный заказ — 500 ₽."
          action={
            <Link href="/">
              <Button variant="primary">Перейти в каталог</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  const belowMin = subtotal < MIN_ORDER_AMOUNT;
  const total = subtotal + DELIVERY_FEE;

  return (
    <PageShell>
      <Header
        variant="page"
        title="Корзина"
        showBack={false}
        rightSlot={
          <button
            type="button"
            onClick={clear}
            className="text-[12px] font-medium text-ink-500 hover:text-red-600"
          >
            Очистить
          </button>
        }
      />

      <div className="px-4 pt-2 pb-4 space-y-2">
        {detailedItems.map(({ product, quantity }) => (
          <div
            key={product.id}
            className="flex gap-3 rounded-2xl bg-ink-50 p-3"
          >
            <Link
              href={`/product/${product.slug}`}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white"
            >
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </Link>
            <div className="flex flex-1 flex-col">
              <Link
                href={`/product/${product.slug}`}
                className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink-900"
              >
                {product.name}
              </Link>
              <div className="mt-0.5 text-[12px] text-ink-500">
                {formatPrice(product.price)} / {product.unit}
              </div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center rounded-xl bg-white">
                  <button
                    type="button"
                    aria-label="Уменьшить"
                    onClick={() => setQuantity(product.id, quantity - 1)}
                    className="flex h-9 w-9 items-center justify-center text-ink-700 hover:bg-ink-100"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-7 text-center text-[14px] font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Увеличить"
                    onClick={() => setQuantity(product.id, quantity + 1)}
                    className="flex h-9 w-9 items-center justify-center text-ink-700 hover:bg-ink-100"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-ink-900">
                    {formatPrice(product.price * quantity)}
                  </span>
                  <button
                    type="button"
                    aria-label="Удалить"
                    onClick={() => remove(product.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-ink-200 p-4 mt-3">
          <Row label="Товары" value={formatPrice(subtotal)} />
          <Row label="Доставка" value={formatPrice(DELIVERY_FEE)} />
          <div className="my-2 border-t border-ink-100" />
          <Row label="Итого" value={formatPrice(total)} bold />
        </div>

        {belowMin && (
          <div className="rounded-2xl bg-amber-50 p-3 text-[12px] text-amber-800">
            Минимальный заказ — {formatPrice(MIN_ORDER_AMOUNT)}. Добавьте ещё
            на <strong>{formatPrice(MIN_ORDER_AMOUNT - subtotal)}</strong>.
          </div>
        )}
      </div>

      <div
        className="fixed bottom-[72px] inset-x-0 z-30 mx-auto max-w-md border-t border-ink-100 bg-white p-3"
        style={{
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <Link href={belowMin ? "#" : "/checkout"}>
          <Button size="lg" fullWidth disabled={belowMin}>
            Оформить заказ · {formatPrice(total)}
          </Button>
        </Link>
      </div>
    </PageShell>
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
    <div className="flex items-center justify-between py-1.5">
      <span
        className={
          bold
            ? "text-[15px] font-semibold text-ink-900"
            : "text-[14px] text-ink-600"
        }
      >
        {label}
      </span>
      <span
        className={
          bold
            ? "text-[18px] font-extrabold text-ink-900"
            : "text-[14px] text-ink-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
