export default function CheckoutLoading() {
  return (
    <div className="animate-pulse pb-20">
      <div className="h-14 bg-ink-100" />
      <div className="px-4 pt-4 space-y-4">
        <div className="h-5 w-40 bg-ink-100 rounded" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-xl bg-ink-50 p-3">
            <div className="h-14 w-14 shrink-0 rounded-lg bg-ink-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-ink-100 rounded" />
              <div className="h-3 w-1/3 bg-ink-100 rounded" />
            </div>
          </div>
        ))}
        <div className="space-y-3 pt-2">
          <div className="h-10 rounded-xl bg-ink-100" />
          <div className="h-10 rounded-xl bg-ink-100" />
          <div className="h-12 rounded-2xl bg-ink-100" />
        </div>
      </div>
    </div>
  );
}
