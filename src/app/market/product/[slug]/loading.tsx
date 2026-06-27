export default function ProductLoading() {
  return (
    <div className="animate-pulse pb-20">
      <div className="h-14 bg-ink-100" />
      <div className="aspect-square bg-ink-100" />
      <div className="px-4 pt-4 space-y-3">
        <div className="h-6 w-3/4 bg-ink-100 rounded" />
        <div className="h-8 w-1/4 bg-ink-100 rounded" />
        <div className="h-3 w-full bg-ink-100 rounded" />
        <div className="h-3 w-2/3 bg-ink-100 rounded" />
        <div className="h-12 rounded-2xl bg-ink-100 mt-4" />
      </div>
    </div>
  );
}
