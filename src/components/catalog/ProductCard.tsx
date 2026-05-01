"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingBasket } from "lucide-react";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const setQuantity = useCart((s) => s.setQuantity);
  const fav = useFavorites((s) => s.ids.includes(product.id));
  const toggleFav = useFavorites((s) => s.toggle);

  const inCart = items.find((i) => i.productId === product.id);
  const qty = inCart?.quantity ?? 0;

  return (
    <div className="group flex flex-col rounded-2xl bg-white">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-ink-100"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 480px) 50vw, 240px"
          className="object-cover transition-transform group-active:scale-95"
        />
        <button
          type="button"
          aria-label={fav ? "Убрать из избранного" : "В избранное"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFav(product.id);
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-700 backdrop-blur transition hover:text-accent-500"
        >
          <Heart
            size={16}
            className={cn(fav && "fill-accent-500 text-accent-500")}
          />
        </button>
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <span className="rounded-full bg-ink-900 px-3 py-1 text-[12px] font-semibold text-white">
              Нет в наличии
            </span>
          </div>
        )}
      </Link>

      <div className="px-1 pt-2 pb-1">
        <div className="text-[15px] font-bold text-ink-900">
          {formatPrice(product.price)}
          {product.unit && (
            <span className="ml-1 text-[12px] font-medium text-ink-500">
              / {product.unit}
            </span>
          )}
        </div>
        <Link
          href={`/product/${product.slug}`}
          className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-700"
        >
          {product.name}
        </Link>
        {product.weight && (
          <p className="mt-0.5 text-[11px] text-ink-500">{product.weight}</p>
        )}
      </div>

      {qty === 0 ? (
        <button
          type="button"
          onClick={() => add(product.id, 1)}
          disabled={!product.inStock}
          className={cn(
            "mt-1 flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-colors",
            product.inStock
              ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
              : "bg-ink-100 text-ink-400"
          )}
        >
          <ShoppingBasket size={16} />В корзину
        </button>
      ) : (
        <div className="mt-1 flex h-10 items-center justify-between rounded-xl bg-brand-600 px-1 text-white">
          <button
            type="button"
            aria-label="Уменьшить"
            onClick={() => setQuantity(product.id, qty - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-brand-700 active:bg-brand-800"
          >
            <Minus size={16} />
          </button>
          <span className="text-[14px] font-bold">{qty}</span>
          <button
            type="button"
            aria-label="Увеличить"
            onClick={() => setQuantity(product.id, qty + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-brand-700 active:bg-brand-800"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
