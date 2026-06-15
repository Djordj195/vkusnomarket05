export default function ShopsLoading() {
  return (
    <div className="animate-pulse pb-20">
      <div className="h-14 bg-ink-100" />
      <div className="px-4 pt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-ink-50 p-4 space-y-2">
            <div className="h-32 rounded-xl bg-ink-100" />
            <div className="h-5 w-2/3 bg-ink-100 rounded" />
            <div className="h-3 w-1/2 bg-ink-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
