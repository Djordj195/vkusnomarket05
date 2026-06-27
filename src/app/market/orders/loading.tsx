export default function OrdersLoading() {
  return (
    <div className="animate-pulse pb-20">
      <div className="h-14 bg-ink-100" />
      <div className="px-4 pt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-ink-50 p-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-ink-100 rounded" />
              <div className="h-4 w-20 bg-ink-100 rounded" />
            </div>
            <div className="h-3 w-1/2 bg-ink-100 rounded" />
            <div className="h-3 w-1/3 bg-ink-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
