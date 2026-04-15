import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-pale px-6">
      <div className="text-center max-w-sm">
        <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400 mb-3">
          403 — Forbidden
        </p>
        <h1 className="font-heading text-[2rem] tracking-[-0.015em] font-bold text-[#071639] mb-3">
          Access Denied
        </h1>
        <p className="font-body text-[0.875rem] leading-[1.6] text-slate-500 mb-8">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#0474C4] text-white font-body text-[0.82rem] font-medium tracking-widest uppercase py-3 px-8 rounded-[32px] hover:bg-[#06457F] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
