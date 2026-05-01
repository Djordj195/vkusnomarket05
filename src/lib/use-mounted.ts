"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Возвращает true только после гидратации на клиенте.
 * Используем `useSyncExternalStore`, чтобы избежать setState в эффекте
 * (правило `react-hooks/set-state-in-effect` в React 19).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
