"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
  className?: string;
};

export function StarRating({
  value,
  onChange,
  size = 20,
  readonly = false,
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const displayValue = hover || value;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => {
        if (!readonly) setHover(0);
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={cn(
              "transition-colors",
              readonly
                ? "cursor-default"
                : "cursor-pointer hover:scale-110 active:scale-95"
            )}
            onClick={() => {
              if (!readonly && onChange) onChange(star);
            }}
            onMouseEnter={() => {
              if (!readonly) setHover(star);
            }}
            aria-label={`${star} из 5`}
          >
            <Star
              size={size}
              className={cn(
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-ink-300"
              )}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

export function StarRatingStatic({
  rating,
  count,
  size = 14,
  className,
}: {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={cn(
            star <= rounded
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-ink-300"
          )}
          strokeWidth={1.5}
        />
      ))}
      {rating > 0 && (
        <span className="ml-0.5 text-[13px] font-semibold text-ink-700">
          {rating.toFixed(1)}
        </span>
      )}
      {typeof count === "number" && count > 0 && (
        <span className="text-[12px] text-ink-500">
          ({count})
        </span>
      )}
    </span>
  );
}
