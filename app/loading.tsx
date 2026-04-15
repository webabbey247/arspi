export default function Loading() {
  return (
    <div className="min-h-screen bg-sky-pale">
      {/* Hero skeleton */}
      <div className="bg-ink-deep px-8 md:px-16 py-24 animate-pulse">
        <div className="max-w-[1400px] mx-auto">
          <div className="h-3 w-32 bg-sapphire/20 rounded mb-6" />
          <div className="h-12 w-3/4 bg-white/8 rounded mb-4" />
          <div className="h-12 w-1/2 bg-white/8 rounded mb-8" />
          <div className="h-4 w-2/3 bg-white/5 rounded mb-3" />
          <div className="h-4 w-1/2 bg-white/5 rounded mb-10" />
          <div className="flex gap-4">
            <div className="h-12 w-36 bg-sapphire/25 rounded-sm" />
            <div className="h-12 w-36 bg-white/8 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="px-8 md:px-16 py-16 max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-3 gap-5 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-sky-light border border-sapphire/15 rounded-sm p-6">
              <div className="h-2 w-20 bg-sapphire/20 rounded mb-4" />
              <div className="h-4 w-full bg-ink/8 rounded mb-2" />
              <div className="h-4 w-4/5 bg-ink/8 rounded mb-4" />
              <div className="h-3 w-1/3 bg-ink/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
