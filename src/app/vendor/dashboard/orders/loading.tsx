export default function VendorOrdersLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-6 w-20 bg-ink-100 rounded" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-16 shrink-0 rounded-full bg-ink-100" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[80px] rounded-2xl bg-ink-100" />
      ))}
    </div>
  );
}
