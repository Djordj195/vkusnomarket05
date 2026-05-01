"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavState = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
};

export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((x) => x !== id)
            : [...state.ids, id],
        })),
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: "vkusnomarket-favorites" }
  )
);
