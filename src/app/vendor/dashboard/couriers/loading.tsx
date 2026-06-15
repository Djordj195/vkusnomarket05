export default function VendorCouriersLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-24 rounded bg-ink-200" />
      <div className="h-4 w-56 rounded bg-ink-100" />

      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-ink-200 bg-white p-3 text-center">
            <div className="mx-auto h-3 w-12 rounded bg-ink-100" />
            <div className="mx-auto mt-2 h-6 w-8 rounded bg-ink-200" />
          </div>
        ))}
      </div>

      <div className="h-11 w-full rounded-xl bg-ink-200" />

      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-ink-200 bg-white p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-ink-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 rounded bg-ink-200" />
              <div className="h-3 w-36 rounded bg-ink-100" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-xl bg-ink-100" />
            <div className="h-8 w-24 rounded-xl bg-ink-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
