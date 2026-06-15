export default function ShopLoading() {
  return (
    <div className="animate-pulse pb-20">
      <div className="h-14 bg-ink-100" />
      <div className="aspect-[16/9] w-full bg-ink-100" />
      <div className="px-4 pt-4 space-y-3">
        <div className="h-6 w-2/3 bg-ink-100 rounded" />
        <div className="h-3 w-1/3 bg-ink-100 rounded" />
        <div className="h-4 w-full bg-ink-100 rounded mt-2" />
        <div className="grid grid-cols-2 gap-3 pt-4">
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
