"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL = 30_000; // 30 секунд

export function VendorOrdersAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
