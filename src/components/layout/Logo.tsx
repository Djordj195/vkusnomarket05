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
          <span className="text-accent-500">МАРКЕТ</span>
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
        <linearGradient id="vmGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="vmOrange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      {/* Зелёный «листочек» — фон */}
      <path
        d="M32 4 C 14 4 4 18 4 32 c 0 16 12 28 28 28 c 18 0 28 -14 28 -30 C 60 14 48 4 32 4 z"
        fill="url(#vmGreen)"
      />
      {/* Стилизованная сумка-пакет / тарелка */}
      <path
        d="M18 26 h 28 l -2 22 a 4 4 0 0 1 -4 4 H 24 a 4 4 0 0 1 -4 -4 z"
        fill="#ffffff"
      />
      {/* Ручки сумки */}
      <path
        d="M24 26 v -4 a 8 8 0 0 1 16 0 v 4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Оранжевая «капля-точка» — апельсин/еда */}
      <circle cx="32" cy="40" r="6" fill="url(#vmOrange)" />
      {/* Маленький зелёный лист на капле */}
      <path
        d="M32 32 c 2 -3 5 -2 5 -2 c 0 3 -2 4 -5 4 z"
        fill="#16a34a"
      />
    </svg>
  );
}
