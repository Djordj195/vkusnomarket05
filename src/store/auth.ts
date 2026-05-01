"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: "vkusnomarket-auth" }
  )
);
