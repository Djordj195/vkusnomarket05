import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  withText?: boolean;
  className?: string;
};

export function Logo({ size = 36, withText = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {withText && (
        <span className="text-[18px] font-extrabold leading-none tracking-tight">
          <span className="text-brand-600">Вкус</span>
          <span className="text-ink-900">Маркет</span>
        </span>
      )}
    </div>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/icon-192.png"
      alt="ВкусМаркет"
      width={size}
      height={size}
      className="rounded-xl"
      priority
    />
  );
}

export function BrandPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent-300 px-3 py-1 text-[12px] font-extrabold tracking-tight text-ink-900 shadow-[0_2px_8px_rgba(245,184,0,0.35)]",
        className
      )}
    >
      ВкусМаркет
    </span>
  );
}
