"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export type InstructorProgramStat = {
  slug:        string
  title:       string
  meta:        string
  price:       string
  rating:      number | null
  reviewCount: number | null
}

type Props = {
  name:          string
  title:         string | null
  categoryLabel: string
  initials:      string | null
  bio:           string | null
  avgRating:     string | null
  totalReviews:  number
  programmeCount: number
  programs:      InstructorProgramStat[]
}

/** "View profile" trigger + modal for the instructor bio card. Entrance-only
 *  fade/scale (the reference has no transition at all here, just instant
 *  conditional render — this adds the same tasteful polish already applied
 *  to the accordions rather than an abrupt show/hide). */
export default function InstructorProfileModal({
  name, title, categoryLabel, initials, bio, avgRating, totalReviews, programmeCount, programs,
}: Props) {
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    const raf = requestAnimationFrame(() => setShown(true))
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      setShown(false)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-body text-[13px] tracking-[0.02em] border border-[#D9D3C8] rounded-[2px] px-4.5 py-2.75 text-[#0B2239] bg-[#FFFDFA] hover:border-[#0B2239] transition-colors duration-200 cursor-pointer shrink-0"
      >
        View profile
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-[100] bg-[#0B2239]/55 backdrop-blur-[3px] flex items-start justify-center px-5 py-[5vh] overflow-y-auto transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[620px] bg-[#FFFDFA] rounded-[4px] shadow-[0_30px_80px_rgba(6,28,50,0.4)] overflow-hidden transition-all duration-200 ${shown ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            {/* Header */}
            <div className="bg-[#0B2239] text-white px-8 py-7 flex gap-5 items-center">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-heading text-[18px] tracking-[0.04em] shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading text-[24px] leading-[1.2]">{name}</div>
                <div className="mt-1.5 font-body text-[11px] tracking-[0.16em] uppercase text-[#BFE0D6]">
                  {title ? `${title} · ${categoryLabel}` : categoryLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-8 h-8 shrink-0 rounded-full border border-white/25 bg-transparent text-white text-[14px] cursor-pointer hover:bg-white/12 transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] border-b border-[#EAE5DC]">
              <div className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className="text-[#F0B429] text-[13px] tracking-[2px]">★★★★★</span>
                  <span className="font-heading text-[24px] leading-none text-[#0B2239]">{avgRating ?? "—"}</span>
                </div>
                <div className="mt-2 font-body text-[10.5px] tracking-[0.16em] uppercase text-[#5A6675]">Average rating</div>
              </div>
              <div className="px-6 py-5 border-l border-[#EAE5DC]">
                <div className="font-heading text-[24px] leading-none text-[#0B2239]">{totalReviews.toLocaleString()}</div>
                <div className="mt-2 font-body text-[10.5px] tracking-[0.16em] uppercase text-[#5A6675]">Reviews across programmes</div>
              </div>
              <div className="px-6 py-5 border-l border-[#EAE5DC]">
                <div className="font-heading text-[24px] leading-none text-[#0B2239]">{programmeCount}</div>
                <div className="mt-2 font-body text-[10.5px] tracking-[0.16em] uppercase text-[#5A6675]">Programmes taught</div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 pt-6.5 pb-8">
              {bio && <p className="mb-6.5 font-body text-[15px] leading-[1.65] text-[#3E4A59] text-pretty">{bio}</p>}
              <div className="font-body text-[10.5px] tracking-[0.18em] uppercase text-[#128C6E]">Programmes by this facilitator</div>
              <div className="mt-3.5 border-t border-[#EAE5DC]">
                {programs.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/programs/${p.slug}`}
                    className="flex gap-4 items-baseline py-3.5 border-b border-[#EAE5DC] text-[#1C2430] hover:text-[#1C2430]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-heading text-[17px] leading-[1.3] text-[#0B2239]">{p.title}</div>
                      <div className="mt-1.25 font-body text-[12.5px] text-[#5A6675]">{p.meta}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-body text-[13.5px] text-[#0B2239]">
                        {p.rating != null ? <><span className="text-[#F0B429]">★</span> {p.rating.toFixed(1)}</> : "—"}
                      </div>
                      <div className="mt-1.25 font-body text-[12px] text-[#5A6675]">
                        {p.reviewCount != null ? `${p.reviewCount} reviews` : "No reviews yet"}
                      </div>
                    </div>
                    <div className="shrink-0 w-14.5 text-right font-body text-[13.5px] text-[#0B2239]">{p.price}</div>
                  </Link>
                ))}
              </div>

              {programmeCount > programs.length && (
                <button
                  type="button"
                  disabled
                  title="Coming soon — will link to this facilitator's full catalogue once the programs page supports filtering by facilitator"
                  className="mt-5 w-full h-11 rounded-[2px] border border-[#EAE5DC] font-body text-[12.5px] tracking-[0.06em] uppercase text-[#9AA5B1] bg-[#FAF6EF] cursor-not-allowed"
                >
                  View more
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
