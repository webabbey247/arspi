"use client"

import * as React from "react"
import Image from "next/image"
import withLayout from "@/hooks/useLayout"

type TeamCategory = "EXECUTIVE_MANAGEMENT" | "STAFF"

type Member = {
  id:           string
  name:         string
  position:     string
  category:     TeamCategory
  coverImage:   string | null
  description:  string | null
  displayOrder: number
}

type GroupedTeam = Record<TeamCategory, Member[]>

const EMPTY_TEAM: GroupedTeam = { EXECUTIVE_MANAGEMENT: [], STAFF: [] }

function MemberGrid({ members }: { members: Member[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {members.map(m => {
        const initials = m.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
        return (
          <div key={m.id} className="flex flex-col group cursor-pointer">
            <div className="relative w-full aspect-3/4 overflow-hidden bg-[#e8e8e8]">
              {m.coverImage ? (
                <Image
                  src={m.coverImage}
                  alt={m.name}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#0474C4]/60 font-heading text-[1.75rem] font-medium">
                  {initials || "?"}
                </div>
              )}
            </div>
            <div className="pt-5">
              <h3 className="font-heading text-xl font-normal text-[#111] leading-snug mb-2">
                {m.name}
              </h3>
              <p className="text-sm text-[#555] leading-relaxed font-light">
                {m.position}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const TeamPage = () => {
  const [team, setTeam]       = React.useState<GroupedTeam>(EMPTY_TEAM)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/team/public")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setTeam(d.team ?? EMPTY_TEAM))
      .catch(() => setTeam(EMPTY_TEAM))
      .finally(() => setLoading(false))
  }, [])

  const executives = team.EXECUTIVE_MANAGEMENT
  const staff      = team.STAFF
  const isEmpty    = !loading && executives.length === 0 && staff.length === 0

  return (
    <>
      {/* Hero */}
      <section className="bg-[#071639] relative overflow-hidden px-8 md:px-16 py-24 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-190">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC] inline-flex items-center gap-2">
            <span className="block w-8 h-px bg-[#EBF3FC]" />
            Our Team
          </p>
          <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white">
            The people behind <em className="italic text-[#0474C4]">ARPS Institute</em>
          </h1>
          <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg mt-3">
            Researchers, educators, and operators committed to evidence-based learning and inclusive growth.
          </p>
        </div>
      </section>

      {/* Banner */}
      <section className="flex flex-col lg:flex-row min-h-150 w-full py-10">
        <div className="relative w-full lg:w-1/2 min-h-100 lg:min-h-150">
          <Image
            src="/images/about-arps.webp"
            alt="ARPS Institute leadership"
            width={800}
            height={600}
            className="object-cover object-center w-auto h-auto"
            priority
          />
        </div>
        <div className="w-full lg:w-1/2 bg-[#fafaf8] flex items-center px-12 md:px-16 lg:px-20 py-16 lg:py-0">
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-normal text-[#111] leading-[1.1] tracking-tight max-w-sm">
            Our leadership team
          </h1>
        </div>
      </section>

      {/* Empty state */}
      {isEmpty && (
        <section className="bg-white px-6 md:px-12 lg:px-20 py-16">
          <div className="bg-[#FAFAF9] border border-[#0474C4]/12 rounded p-10 text-center">
            <p className="font-heading text-[1.125rem] font-semibold text-ink mb-2">
              Profiles coming soon
            </p>
            <p className="font-body text-[0.875rem] text-slate-500 max-w-md mx-auto">
              We&apos;re putting the finishing touches on team profiles. Check back shortly.
            </p>
          </div>
        </section>
      )}

      {/* Executive Management */}
      {executives.length > 0 && (
        <section className="bg-white px-6 md:px-12 lg:px-20 py-16">
          <h2 className="font-heading text-5xl md:text-6xl font-normal text-[#111] tracking-tight mb-14">
            Executive Management
          </h2>
          <MemberGrid members={executives} />
        </section>
      )}

      {/* Our Staff */}
      {staff.length > 0 && (
        <section className="bg-white px-6 md:px-12 lg:px-20 py-16">
          <h2 className="font-heading text-5xl md:text-6xl font-normal text-[#111] tracking-tight mb-14">
            Our Staff
          </h2>
          <MemberGrid members={staff} />
        </section>
      )}

      {loading && (
        <section className="bg-white px-6 md:px-12 lg:px-20 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-3/4 bg-[#f5f4f1] animate-pulse" />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default withLayout(TeamPage)
