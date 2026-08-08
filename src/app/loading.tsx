export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <div className="h-10 w-48 animate-pulse rounded-sm bg-white/10" />
      <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded-sm bg-white/[0.06]" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square animate-pulse rounded-sm bg-white/[0.06]" />
            <div className="h-3 w-[75%] animate-pulse rounded-sm bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded-sm bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
