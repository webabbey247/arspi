export default function WorkshopDetailLoading() {
  return (
    <>
      {/* ── Hero skeleton — title (2/3) + share card (1/3) ──────────────── */}
      <section className="bg-[#071639] relative px-8 md:px-16 py-16 md:py-24 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="relative max-w-350 mx-auto z-10 animate-pulse">
          <div className="h-3 w-32 bg-white/15 rounded mb-8" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16 items-start">
            {/* Left — title */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="h-5 w-14 bg-white/15 rounded-full" />
                <div className="h-5 w-24 bg-white/15 rounded-full" />
                <div className="h-5 w-20 bg-white/15 rounded-full" />
              </div>

              <div className="flex flex-col gap-3 mb-4">
                <div className="h-10 md:h-12 bg-white/15 rounded" />
                <div className="h-10 md:h-12 w-5/6 bg-white/15 rounded" />
                <div className="h-10 md:h-12 w-2/3 bg-white/15 rounded" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="h-4 bg-white/10 rounded" />
                <div className="h-4 w-11/12 bg-white/10 rounded" />
                <div className="h-4 w-3/4 bg-white/10 rounded" />
              </div>
            </div>

            {/* Right — share card */}
            <div className="lg:col-span-1">
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="h-3 w-32 bg-white/15 rounded mb-3" />
                <div className="h-3 bg-white/10 rounded mb-1.5" />
                <div className="h-3 w-3/4 bg-white/10 rounded mb-5" />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="h-9 bg-white/10 rounded-lg" />
                  ))}
                </div>
                <div className="h-10 bg-white/15 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cover image placeholder ─────────────────────────────────────── */}
      <section className="relative w-full h-[42vh] md:h-[60vh] bg-[#0B1B3A] animate-pulse" />

      {/* ── Body + sidebar skeleton ─────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20 px-8 md:px-16 w-full">
        <div className="max-w-350 mx-auto grid lg:grid-cols-[1fr_400px] gap-12">

          {/* Main column */}
          <div className="min-w-0 animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 w-11/12 bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />

            <div className="h-7 w-2/3 bg-slate-200 rounded mt-8 mb-2" />

            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 w-11/12 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 w-2/3 bg-slate-200 rounded" />

            <div className="h-7 w-1/2 bg-slate-200 rounded mt-8 mb-2" />

            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />

            {/* Facilitators block */}
            <div className="mt-12 pt-2">
              <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 border-t border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-3/4 bg-slate-200 rounded" />
                      <div className="h-3 w-2/3 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full max-w-100 lg:sticky lg:top-24 self-start space-y-6 animate-pulse">
            {/* Workshop Details — mini-card grid */}
            <div>
              <div className="h-3 w-32 bg-slate-200 rounded mb-3" />
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-white rounded px-4 py-3 flex flex-col gap-1.5 border border-[#0474C4]/12">
                    <div className="h-3 w-16 bg-slate-200 rounded" />
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div className="bg-white border border-[#0474C4]/12 rounded p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-3 w-12 bg-slate-200 rounded" />
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full" />
              <div className="h-3 w-32 bg-slate-200 rounded mt-2" />
            </div>

            {/* Register CTA */}
            <div className="bg-[#0474C4]/15 rounded p-5">
              <div className="h-5 w-32 bg-slate-200 rounded mb-3" />
              <div className="h-3 bg-slate-200 rounded mb-1.5" />
              <div className="h-3 w-2/3 bg-slate-200 rounded mb-5" />
              <div className="h-12 bg-slate-200 rounded" />
            </div>
          </aside>
        </div>
      </section>

      {/* ── Related workshops skeleton (4 cards) ────────────────────────── */}
      <section className="bg-[#FAFAF9] py-16 md:py-20 px-8 md:px-16 w-full border-t border-[#E5E2DC]">
        <div className="max-w-350 mx-auto animate-pulse">
          <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
            <div>
              <div className="h-3 w-32 bg-slate-200 rounded mb-2" />
              <div className="h-7 w-56 bg-slate-200 rounded" />
            </div>
            <div className="hidden md:block h-3 w-16 bg-slate-200 rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-sm overflow-hidden">
                <div className="relative aspect-16/10 bg-slate-200">
                  <div className="absolute top-3 left-3 h-5 w-14 bg-white/60 rounded-sm" />
                </div>
                <div className="px-5 pt-[1.3rem] pb-[1.5rem]">
                  <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
                  <div className="h-4 bg-slate-200 rounded mb-1.5" />
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
