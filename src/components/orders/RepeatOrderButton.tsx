"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/store/cart";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  order: Order;
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
};

export function RepeatOrderButton({
  order,
  variant = "primary",
  size = "sm",
  fullWidth,
  className,
}: Props) {
  const router = useRouter();
  const replaceAll = useCart((s) => s.replaceAll);
  const [busy, setBusy] = useState(false);

  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    replaceAll(
      order.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }))
    );
    router.push("/market/cart?repeated=1");
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handle}
      disabled={busy}
      className={cn(className)}
    >
      <Repeat size={16} />
      {busy ? "Открываем корзину…" : "Повторить заказ"}
    </Button>
  );
}
