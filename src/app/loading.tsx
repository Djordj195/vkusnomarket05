export default function HomeLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-20">
      {/* Hero */}
      <div className="h-[180px] bg-ink-100 rounded-b-3xl" />

      {/* Stories rail */}
      <div className="px-4 space-y-2">
        <div className="h-5 w-32 bg-ink-100 rounded" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[160px] w-[112px] shrink-0 rounded-2xl bg-ink-100" />
          ))}
        </div>
      </div>

      {/* Categories grid */}
      <div className="px-4 space-y-2">
        <div className="h-5 w-40 bg-ink-100 rounded" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[80px] rounded-2xl bg-ink-100" />
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="px-4 space-y-2">
        <div className="h-5 w-36 bg-ink-100 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square rounded-2xl bg-ink-100" />
              <div className="h-4 w-16 bg-ink-100 rounded" />
              <div className="h-3 w-24 bg-ink-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
