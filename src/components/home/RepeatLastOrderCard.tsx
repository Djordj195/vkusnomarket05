"use client";

import { useRouter } from "next/navigation";
import { Repeat, ArrowRight } from "lucide-react";
import { useOrders } from "@/store/orders";
import { useCart } from "@/store/cart";
import { useMounted } from "@/lib/use-mounted";
import { formatPrice } from "@/lib/utils";

export function RepeatLastOrderCard() {
  const router = useRouter();
  const mounted = useMounted();
  const orders = useOrders((s) => s.orders);
  const replaceAll = useCart((s) => s.replaceAll);

  if (!mounted) return null;
  const lastOrder = orders[0];
  if (!lastOrder) return null;
  if (lastOrder.items.length === 0) return null;

  const handleClick = () => {
    replaceAll(
      lastOrder.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }))
    );
    router.push("/market/cart?repeated=1");
  };

  return (
    <section className="px-4">
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-3 rounded-3xl bg-gradient-to-r from-brand-600 to-brand-500 p-4 text-left text-white shadow-md shadow-brand-600/30 active:scale-[0.99]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
          <Repeat size={22} strokeWidth={2.4} />
        </span>
        <span className="flex-1 leading-tight">
          <span className="block text-[15px] font-extrabold">
            Повторить последний заказ
          </span>
          <span className="mt-0.5 block text-[12px] text-white/85">
            {lastOrder.items.length}{" "}
            {pluralize(lastOrder.items.length, [
              "товар",
              "товара",
              "товаров",
            ])}{" "}
            · {formatPrice(lastOrder.subtotal)} · можно изменить перед оплатой
          </span>
        </span>
        <ArrowRight size={18} className="shrink-0 text-white/85" />
      </button>
    </section>
  );
}

function pluralize(n: number, forms: [string, string, string]): string {
  const m100 = n % 100;
  const m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return forms[2];
  if (m10 === 1) return forms[0];
  if (m10 >= 2 && m10 <= 4) return forms[1];
  return forms[2];
}
