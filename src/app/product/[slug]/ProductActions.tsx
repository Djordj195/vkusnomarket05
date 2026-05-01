"use client";

import { Heart, Minus, Plus, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductActions({ product }: { product: Product }) {
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const setQuantity = useCart((s) => s.setQuantity);
  const fav = useFavorites((s) => s.ids.includes(product.id));
  const toggleFav = useFavorites((s) => s.toggle);

  const item = items.find((i) => i.productId === product.id);
  const qty = item?.quantity ?? 0;

  return (
    <div
      className="fixed bottom-[72px] inset-x-0 z-30 mx-auto max-w-md border-t border-ink-100 bg-white p-3"
      style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => toggleFav(product.id)}
          aria-label={fav ? "Убрать из избранного" : "В избранное"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-ink-200 text-ink-700 hover:bg-ink-50"
        >
          <Heart size={20} className={cn(fav && "fill-accent-500 text-accent-500")} />
        </button>

        {qty === 0 ? (
          <Button
            size="lg"
            fullWidth
            disabled={!product.inStock}
            onClick={() => add(product.id, 1)}
          >
            <ShoppingBasket size={18} />
            <span>В корзину · {formatPrice(product.price)}</span>
          </Button>
        ) : (
          <div className="flex flex-1 items-center justify-between rounded-2xl bg-brand-600 px-2 text-white h-13">
            <button
              type="button"
              aria-label="Уменьшить"
              onClick={() => setQuantity(product.id, qty - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-brand-700 active:bg-brand-800"
            >
              <Minus size={20} />
            </button>
            <div className="text-center leading-tight">
              <div className="text-[13px] font-semibold">{qty} в корзине</div>
              <div className="text-[12px] text-brand-100">
                {formatPrice(product.price * qty)}
              </div>
            </div>
            <button
              type="button"
              aria-label="Увеличить"
              onClick={() => setQuantity(product.id, qty + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-brand-700 active:bg-brand-800"
            >
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
