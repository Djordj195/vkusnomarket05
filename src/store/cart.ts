"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PRODUCTS } from "@/data/products";
import type { CartItem, Product } from "@/lib/types";

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  setHydrated: () => void;
  add: (productId: string, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
  detailedItems: () => Array<CartItem & { product: Product }>;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      add: (productId, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { productId, quantity }] };
        }),
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.productId !== productId),
            };
          }
          const existing = state.items.find((i) => i.productId === productId);
          if (!existing) {
            return { items: [...state.items, { productId, quantity }] };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          };
        }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => {
        const items = get().items;
        return items.reduce((sum, i) => {
          const p = PRODUCTS.find((pr) => pr.id === i.productId);
          return sum + (p ? p.price * i.quantity : 0);
        }, 0);
      },
      detailedItems: () => {
        return get()
          .items.map((i) => {
            const product = PRODUCTS.find((p) => p.id === i.productId);
            return product ? { ...i, product } : null;
          })
          .filter((x): x is CartItem & { product: Product } => x !== null);
      },
    }),
    {
      name: "vkusnomarket-cart",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
