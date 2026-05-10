"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import withLayout from "@/hooks/useLayout"
import PageHero from "@/components/sections/PageHero"

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

function Initials({ name }: { name: string }) {
  const text = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase() || "?"
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0474C4]/20 to-[#0474C4]/5">
      <span className="font-heading text-[1.75rem] sm:text-[2rem] md:text-[2.5rem] font-semibold text-[#0474C4]/70 select-none">
        {text}
      </span>
    </div>
  )
}

function ExecutiveGrid({ members }: { members: Member[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      {members.map((m, i) => (
        <div
          key={m.id}
          className={`group relative overflow-hidden bg-[#e8e8e8] cursor-pointer${
            i === 0 && members.length > 2 ? " sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""
          }`}
          style={{ aspectRatio: i === 0 && members.length > 2 ? "unset" : "3/4", minHeight: i === 0 && members.length > 2 ? "28rem" : undefined }}
        >
          {m.coverImage ? (
            <Image
              src={m.coverImage}
              alt={m.name}
              fill
              className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <Initials name={m.name} />
          )}

          {/* Always-visible gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent transition-opacity duration-500" />

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 translate-y-0 transition-transform duration-500">
            <p className="font-body text-[0.625rem] sm:text-[0.6875rem] md:text-[0.7rem] tracking-widest uppercase text-white/60 mb-1 sm:mb-1.5">
              {m.position}
            </p>
            <h3 className="font-heading text-lg sm:text-xl font-normal text-white leading-snug">
              {m.name}
            </h3>
            {m.description && (
              <p className="font-body text-[0.75rem] sm:text-[0.8125rem] text-white/70 leading-relaxed mt-2 sm:mt-3 max-h-0 overflow-hidden opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-500 ease-out">
                {m.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function StaffGrid({ members }: { members: Member[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
      {members.map(m => (
        <div key={m.id} className="group cursor-pointer">
          <div className="relative w-full aspect-square overflow-hidden bg-[#e8e8e8] mb-4">
            {m.coverImage ? (
              <Image
                src={m.coverImage}
                alt={m.name}
                fill
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]"
              />
            ) : (
              <Initials name={m.name} />
            )}
            {/* Subtle overlay on hover */}
            <div className="absolute inset-0 bg-[#0474C4]/0 group-hover:bg-[#0474C4]/8 transition-colors duration-400" />
          </div>
          {/* Accent line animates in on hover */}
          <div className="w-0 group-hover:w-8 h-px bg-[#0474C4] transition-all duration-400 mb-3" />
          <h3 className="font-heading text-[1rem] font-normal text-[#111] leading-snug">
            {m.name}
          </h3>
          <p className="text-[0.75rem] text-[#777] font-light mt-1 leading-relaxed">
            {m.position}
          </p>
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <span className="font-body text-[0.65rem] tracking-[0.15em] uppercase text-[#0474C4] font-medium">
        {number}
      </span>
      <div className="h-px flex-1 max-w-12 bg-[#0474C4]/30" />
      <span className="font-body text-[0.65rem] tracking-[0.15em] uppercase text-[#888] font-medium">
        {label}
      </span>
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
      <PageHero
        tagline="Our Team"
        captionTextOne="The people behind "
        highlightText="ARPS Institute"
        captionTextTwo=""
        description="Researchers, educators, and operators committed to evidence-based learning and inclusive growth."
        pageType="team"
        imageUrl="/images/about-arps.webp"
      />

      {/* Loading skeletons */}
      {loading && (
        <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-12 sm:py-16 md:py-20">
          <div className="h-3 w-32 bg-[#f0efec] animate-pulse rounded mb-8 sm:mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-14 sm:mb-20">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-3/4 bg-[#f5f4f1] animate-pulse" />
            ))}
          </div>
          <div className="h-3 w-32 bg-[#f0efec] animate-pulse rounded mb-8 sm:mb-10" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-square bg-[#f5f4f1] animate-pulse" />
                <div className="h-3 w-3/4 bg-[#f0efec] animate-pulse rounded" />
                <div className="h-2.5 w-1/2 bg-[#f0efec] animate-pulse rounded" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {isEmpty && (
        <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-16 sm:py-20 md:py-24">
          <div className="border border-dashed border-[#ddd] rounded p-8 sm:p-12 md:p-14 text-center max-w-lg mx-auto">
            <p className="font-heading text-[1.125rem] sm:text-[1.25rem] font-normal text-[#111] mb-2">
              Profiles coming soon
            </p>
            <p className="font-body text-[0.8125rem] sm:text-[0.875rem] text-[#888] leading-relaxed">
              We&apos;re putting the finishing touches on team profiles. Check back shortly.
            </p>
          </div>
        </section>
      )}

      {/* Executive Management */}
      {executives.length > 0 && (
        <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pt-12 sm:pt-16 md:pt-20 pb-6 w-full">
          <SectionLabel number="01" label="Leadership" />
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal text-[#111] tracking-tight mb-8 sm:mb-10">
            Executive Management
          </h2>
          <ExecutiveGrid members={executives} />
        </section>
      )}

      {/* Staff */}
      {staff.length > 0 && (
        <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-12 sm:py-16 md:py-20">
          <SectionLabel number="02" label="Our People" />
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal text-[#111] tracking-tight mb-8 sm:mb-10">
            Our Staff
          </h2>
          <StaffGrid members={staff} />
        </section>
      )}

      {/* Join CTA */}
      {!loading && (
        <section className="bg-[#060D14] px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-12 sm:py-16 md:py-20 w-full">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8">
            <div className="max-w-lg">
              <p className="font-body text-[0.65rem] tracking-[0.15em] uppercase text-[#0474C4] font-medium mb-3 sm:mb-4">
                Join Us
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal text-white leading-[1.1] tracking-tight">
                Want to be part of our team?
              </h2>
              <p className="font-body text-[0.875rem] sm:text-[0.9375rem] text-white/50 leading-relaxed mt-3 sm:mt-4">
                We&apos;re always looking for curious minds and driven professionals to grow with us.
              </p>
            </div>
            <Link
              href="/careers"
              className="group inline-flex items-center gap-3 border border-white/20 hover:border-[#0474C4] text-white hover:text-[#0474C4] font-body text-[0.8125rem] sm:text-[0.875rem] tracking-wide px-5 sm:px-7 py-3 sm:py-4 transition-colors duration-300 whitespace-nowrap self-start md:self-auto"
            >
              View open roles
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      )}
    </>
  )
}

export default withLayout(TeamPage)
