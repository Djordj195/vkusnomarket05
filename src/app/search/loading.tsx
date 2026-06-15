export default function SearchLoading() {
  return (
    <div className="animate-pulse pb-20">
      <div className="h-14 bg-ink-100" />
      <div className="px-4 pt-4 space-y-3">
        <div className="h-10 rounded-xl bg-ink-100" />
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
