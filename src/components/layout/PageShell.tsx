import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  noBottomPadding,
}: {
  children: React.ReactNode;
  className?: string;
  noBottomPadding?: boolean;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-md min-h-screen bg-white",
        !noBottomPadding && "pb-bottom-nav",
        className
      )}
    >
      {children}
    </main>
  );
}
