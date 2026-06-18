export default function VendorDashboardLoading() {
  return (
    <div className="animate-pulse space-y-5 p-4">
      <div className="flex justify-between">
        <div className="space-y-1">
          <div className="h-6 w-24 bg-ink-100 rounded" />
          <div className="h-3 w-32 bg-ink-100 rounded" />
        </div>
        <div className="h-6 w-16 bg-ink-100 rounded-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[100px] rounded-2xl bg-ink-100" />
        ))}
      </div>
      <div className="h-[80px] rounded-2xl bg-ink-100" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-2xl bg-ink-100" />
        ))}
      </div>
    </div>
  );
}
