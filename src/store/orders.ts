"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "@/lib/types";

type OrdersState = {
  orders: Order[];
  add: (order: Order) => void;
  upsert: (order: Order) => void;
  getById: (id: string) => Order | undefined;
  reset: () => void;
};

export const useOrders = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      add: (order) =>
        set((state) => ({ orders: [order, ...state.orders] })),
      upsert: (order) =>
        set((state) => {
          const idx = state.orders.findIndex((o) => o.id === order.id);
          if (idx === -1) {
            return { orders: [order, ...state.orders] };
          }
          const next = state.orders.slice();
          next[idx] = order;
          return { orders: next };
        }),
      getById: (id) => get().orders.find((o) => o.id === id),
      reset: () => set({ orders: [] }),
    }),
    { name: "vkusnomarket-orders" }
  )
);
