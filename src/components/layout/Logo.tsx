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
          <span className="text-brand-600">ВКУСНО</span>
          <span className="text-ink-900">МАРКЕТ</span>
        </span>
      )}
    </div>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ВКУСНОМАРКЕТ"
    >
      <defs>
        <linearGradient id="vmPurple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9277ff" />
          <stop offset="100%" stopColor="#5b30f0" />
        </linearGradient>
        <linearGradient id="vmYellow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe53a" />
          <stop offset="100%" stopColor="#f5b800" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#vmPurple)" />
      <path
        d="M18 26 h 28 l -2 22 a 4 4 0 0 1 -4 4 H 24 a 4 4 0 0 1 -4 -4 z"
        fill="#ffffff"
      />
      <path
        d="M24 26 v -4 a 8 8 0 0 1 16 0 v 4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="40" r="6" fill="url(#vmYellow)" />
    </svg>
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
      ВКУСНОМАРКЕТ
    </span>
  );
}
