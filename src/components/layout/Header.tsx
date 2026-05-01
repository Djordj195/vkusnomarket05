"use client";

import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { CITY_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type HeaderProps = {
  variant?: "home" | "page";
  title?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
};

export function Header({
  variant = "home",
  title,
  showBack,
  rightSlot,
  className,
}: HeaderProps) {
  const router = useRouter();

  if (variant === "home") {
    return (
      <header
        className={cn(
          "sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-ink-100",
          className
        )}
      >
        <div className="mx-auto max-w-md px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <Link href="/" className="block">
              <Logo size={32} />
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[12px] font-medium text-brand-700"
            >
              <MapPin size={14} />
              <span>{CITY_NAME}</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-ink-100",
        className
      )}
    >
      <div className="mx-auto max-w-md px-2 py-3 flex items-center gap-1.5">
        {showBack !== false && (
          <button
            type="button"
            aria-label="Назад"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <h1 className="flex-1 truncate text-[16px] font-semibold text-ink-900">
          {title}
        </h1>
        {rightSlot}
      </div>
    </header>
  );
}
