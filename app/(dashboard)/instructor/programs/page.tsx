"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import SubmitForApprovalDialog from "@/components/programs/SubmitForApprovalDialog"
import { RowActions, RowIcon } from "@/components/admin/AdminKit"
import type { DropdownItem } from "@/components/ui/DropdownMenu"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TableSkeletonRows, SkeletonCardList } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"
import { type CourseLevel, type Category, type Program, LEVEL_LABELS, LEVEL_COLORS, slugify, fmtDate, fmtPrice, facilitatorSummary } from "./program-shared"
import { type ProgramFormValues } from "./ProgramEditor"

// The editor is heavy (rich-text editors, form + validation libraries) and
// only needed once a modal opens, so it loads on demand.
const ProgramModal = dynamic(() => import("./ProgramEditor").then(m => m.ProgramModal), { ssr: false })


// ── Main page ─────────────────────────────────────────────────────────────────

export default function InstructorProgramsPage() {
  // Fetch the editor in the background once the list is up, so the first
  // "Edit"/"New" opens instantly without it weighing on the initial load.
  useEffect(() => { void import("./ProgramEditor") }, [])

  const [programs, setPrograms]               = useState<Program[]>([])
  const [programsLoading, setProgramsLoading] = useState(true)
  const [search, setSearch]                   = useState("")
  const [levelFilter, setLevelFilter]         = useState<CourseLevel | "All">("All")
  const [pricingFilter, setPricingFilter]     = useState<"All" | "Free" | "Paid" | "Featured">("All")
  // "All", a category id, or "none" for programmes with no category.
  const [categoryFilter, setCategoryFilter]   = useState<string>("All")
  const [categoryOpen, setCategoryOpen]       = useState(false)
  const categoryRef                           = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [programModal, setProgramModal]       = useState<"create" | Program | null>(null)
  const [submitProgram, setSubmitProgram]     = useState<Program | null>(null)
  const [hydratingId, setHydratingId]         = useState<string | null>(null)
  const [filterOpen, setFilterOpen]           = useState(false)
  const [statusOpen, setStatusOpen]           = useState(false)
  const filterRef                             = useRef<HTMLDivElement>(null)
  const statusRef                             = useRef<HTMLDivElement>(null)
  const PAGE_SIZE                             = 20
  const [page, setPage]                       = useState(1)

  const [categories, setCategories] = useState<Category[]>([])
  const [formats, setFormats]       = useState<{ id: string; name: string }[]>([])

  const fetchPrograms = useCallback(async () => {
    setProgramsLoading(true)
    try {
      const r = await fetch("/api/instructor/programs")
      const d = await r.json()
      if (r.ok) setPrograms(d.programs ?? [])
    } finally {
      setProgramsLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    const [r, rf] = await Promise.all([fetch("/api/programs/categories"), fetch("/api/programs/formats")])
    const [d, df] = await Promise.all([r.json().catch(() => ({})), rf.json().catch(() => ({}))])
    if (r.ok) setCategories(d.categories ?? [])
    if (rf.ok) setFormats(df.formats ?? [])
  }, [])

  useEffect(() => { fetchPrograms(); fetchCategories() }, [fetchPrograms, fetchCategories])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setCategoryOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  function exportCSV() {
    const headers = ["Title", "Slug", "Category", "Level", "Pricing", "Price", "Facilitators", "Enrolled", "Featured", "Created"]
    const rows = filteredPrograms.map(p => [
      `"${p.title.replace(/"/g, '""')}"`,
      p.slug,
      p.category?.name ?? "",
      LEVEL_LABELS[p.level],
      p.pricing,
      fmtPrice(p.price, p.pricing),
      `"${facilitatorSummary(p).replace(/"/g, '""')}"`,
      String(p._count.enrollments),
      p.featured ? "Yes" : "No",
      fmtDate(p.createdAt),
    ])
    const csv  = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `my-programs-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function filterArr(arr: string[]): string[] | null {
    const f = arr.filter(s => s.trim())
    return f.length > 0 ? f : null
  }

  async function handleSaveProgram(values: ProgramFormValues) {
    const editing = programModal !== "create" ? programModal : null

    const curriculumPayload = values.curriculum
      .filter(m => m.title.trim())
      .map(m => ({
        id:    m.id || crypto.randomUUID(),
        title: m.title,
        desc:  m.desc || null,
        lessons: m.lessons
          .filter(l => l.title.trim())
          .map(l => ({
            id:          l.id || crypto.randomUUID(),
            title:       l.title,
            description: l.description || null,
            orientation: l.orientation || null,
            blocks:      l.blocks ?? [],
          })),
      }))

    const facilitatorsPayload = values.facilitators
      .filter(f => f.name.trim())
      .map(f => ({
        name:        f.name.trim(),
        imageUrl:    f.imageUrl?.trim() || null,
        title:       f.title.trim(),
        bio:         f.bio,
        credentials: f.credentials?.trim() || null,
      }))

    const faqsPayload = values.faqs.filter(f => f.q.trim())

    const payload = {
      title:       values.title,
      slug:        values.slug || slugify(values.title),
      excerpt:     values.excerpt,
      thumbnail:   values.thumbnail || null,
      pricing:     values.pricing,
      paymentType: values.pricing === "paid" ? (values.paymentType || null) : null,
      price:       values.pricing === "paid" ? (parseFloat(values.price) || 0) : 0,
      level:       values.level,
      categoryId:  values.categoryId || null,
      featured:    values.featured,

      tagline:    values.tagline    || null,
      duration:   values.duration   || null,
      format:     values.format     || null,
      programFormatId: values.programFormatId || null,
      startDate:  values.startDate  || null,
      endDate:    values.endDate    || null,
      cohortSize: values.cohortSize  ? parseInt(values.cohortSize) : null,

      overview:           values.overview || null,
      outlineIntro:       values.outlineIntro?.trim() || null,
      targetAudience:     filterArr(values.targetAudience),
      learningObjectives: filterArr(values.learningObjectives),
      whatIsIncluded:     filterArr(values.whatIsIncluded),
      curriculum:         curriculumPayload.length   > 0 ? curriculumPayload   : null,
      facilitators:       facilitatorsPayload.length > 0 ? facilitatorsPayload : null,
      faqs:               faqsPayload.length         > 0 ? faqsPayload         : null,
    }
    const res  = await fetch(editing ? `/api/instructor/programs/${editing.id}` : "/api/instructor/programs", {
      method:  editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save program.")
    setProgramModal(null)
    await fetchPrograms()
  }



  useEffect(() => { setPage(1) }, [search, levelFilter, pricingFilter, categoryFilter])

  const filteredPrograms = programs.filter(p => {
    const matchPricing =
      pricingFilter === "All"      ? true :
      pricingFilter === "Free"     ? p.pricing === "free" :
      pricingFilter === "Paid"     ? p.pricing === "paid" :
      pricingFilter === "Featured" ? p.featured : true

    const matchLevel = levelFilter === "All" || p.level === levelFilter
    const matchCategory =
      categoryFilter === "All"  ? true :
      categoryFilter === "none" ? !p.categoryId :
      p.categoryId === categoryFilter

    const q = search.toLowerCase()
    return matchPricing && matchLevel && matchCategory && (
      !q ||
      p.title.toLowerCase().includes(q) ||
      facilitatorSummary(p).toLowerCase().includes(q) ||
      (p.category?.name ?? "").toLowerCase().includes(q)
    )
  })

  /** The table holds narrow rows; the editor needs the full record
   *  (curriculum, FAQs, overview…), so fetch it by id when opening. */
  async function openProgramEditor(p: Program) {
    setHydratingId(p.id)
    try {
      const res = await fetch(`/api/instructor/programs/${p.id}`)
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.program) {
        toast.error(d.error ?? "Could not open the programme.")
        return
      }
      setProgramModal(d.program as Program)
    } finally {
      setHydratingId(null)
    }
  }

  /** Same row menu as the admin's Programs list, minus what's admin-only:
   *  assigning, approving and deleting. */
  function programActions(p: Program): DropdownItem[] {
    return [
      { label: "View analytics", icon: RowIcon.analytics, onSelect: () => router.push(`/instructor/programs/${p.slug}`) },
      // Same as the admin list. A draft 404s for the public, but the programme
      // 404 page sends its own instructor straight into the draft preview.
      { label: "View public page", icon: RowIcon.view, onSelect: () => window.open(`/programs/${p.slug}`, "_blank", "noopener,noreferrer") },
      { label: hydratingId === p.id ? "Opening…" : "Edit programme", icon: RowIcon.edit, onSelect: () => openProgramEditor(p) },
      { type: "separator" },
      {
        label: p.submittedForReviewAt ? "Resubmit for approval" : "Submit for approval",
        icon: RowIcon.publish,
        onSelect: () => setSubmitProgram(p),
      },
    ]
  }

  const counts = {
    all:      programs.length,
    free:     programs.filter(p => p.pricing === "free").length,
    paid:     programs.filter(p => p.pricing === "paid").length,
    featured: programs.filter(p => p.featured).length,
  }

  const totalPages        = Math.max(1, Math.ceil(filteredPrograms.length / PAGE_SIZE))
  const paginatedPrograms = filteredPrograms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Instructor</span>
          <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">My Programs</h1>
          <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">
            Programmes assigned to you. Review and edit them, then submit them for approval.
          </p>
        </div>
      </div>

      {/* Programs table card */}
      <div className="rounded-[16px] border border-[#DFE2ED] overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 bg-white border-b border-[#DFE2ED]">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors" />
          </div>

          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            {/* Pricing / featured filter */}
            <div ref={statusRef} className="relative">
              <button
                onClick={() => setStatusOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${pricingFilter !== "All" ? "bg-[#6655DF] text-white border-[#6655DF]" : "bg-white text-[#69708A] border-[#DFE2ED] hover:border-[#6655DF] hover:text-[#6655DF]"}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
                Pricing
                {pricingFilter !== "All" && <span className="ml-1 bg-white text-[#6655DF] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{pricingFilter}</span>}
              </button>
              {statusOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#DFE2ED] rounded-xl shadow-lg py-1.5 min-w-36">
                  {([
                    ["All",      counts.all],
                    ["Free",     counts.free],
                    ["Paid",     counts.paid],
                    ["Featured", counts.featured],
                  ] as const).map(([label, count]) => (
                    <button key={label} onClick={() => { setPricingFilter(label as typeof pricingFilter); setStatusOpen(false) }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${pricingFilter === label ? "bg-[#EEECFF] text-[#6655DF]" : "bg-transparent text-[#171C35] hover:bg-[#F5F6FB]"}`}
                    >
                      <span>{label === "All" ? "All Programs" : label}</span>
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F5F6FB] text-[#69708A]">{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Level filter */}
            {/* Category filter — options come from this instructor's own programmes */}
            <div ref={categoryRef} className="relative">
              <button
                onClick={() => setCategoryOpen(o => !o)}
                aria-haspopup="listbox" aria-expanded={categoryOpen}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${categoryFilter !== "All" ? "bg-[#6655DF] text-white border-[#6655DF]" : "bg-white text-[#69708A] border-[#DFE2ED] hover:border-[#6655DF] hover:text-[#6655DF]"}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
                Category
                {categoryFilter !== "All" && (
                  <span className="ml-1 max-w-28 truncate bg-white text-[#6655DF] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {categoryFilter === "none" ? "None" : programs.find(p => p.categoryId === categoryFilter)?.category?.name ?? "—"}
                  </span>
                )}
              </button>
              {categoryOpen && (
                <div role="listbox" className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#DFE2ED] rounded-xl shadow-lg py-1.5 min-w-52 max-h-72 overflow-y-auto">
                  {[
                    { id: "All", name: "All Categories", count: programs.length },
                    ...Array.from(
                      new Map(programs.filter(p => p.categoryId && p.category).map(p => [p.categoryId!, p.category!.name])).entries(),
                    )
                      .sort((a, b) => a[1].localeCompare(b[1]))
                      .map(([id, name]) => ({ id, name, count: programs.filter(p => p.categoryId === id).length })),
                    ...(programs.some(p => !p.categoryId)
                      ? [{ id: "none", name: "No category", count: programs.filter(p => !p.categoryId).length }]
                      : []),
                  ].map(opt => (
                    <button key={opt.id} role="option" aria-selected={categoryFilter === opt.id}
                      onClick={() => { setCategoryFilter(opt.id); setCategoryOpen(false) }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${categoryFilter === opt.id ? "bg-[#EEECFF] text-[#6655DF]" : "bg-transparent text-[#171C35] hover:bg-[#F5F6FB]"}`}
                    >
                      <span className="truncate">{opt.name}</span>
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F5F6FB] text-[#69708A]">{opt.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={filterRef} className="relative">
              <button
                onClick={() => setFilterOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${levelFilter !== "All" ? "bg-[#6655DF] text-white border-[#6655DF]" : "bg-white text-[#69708A] border-[#DFE2ED] hover:border-[#6655DF] hover:text-[#6655DF]"}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
                Level
                {levelFilter !== "All" && <span className="ml-1 bg-white text-[#6655DF] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{LEVEL_LABELS[levelFilter]}</span>}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#DFE2ED] rounded-xl shadow-lg py-1.5 min-w-36">
                  {(["All", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map(l => (
                    <button key={l} onClick={() => { setLevelFilter(l); setFilterOpen(false) }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${levelFilter === l ? "bg-[#FEF3C7] text-[#6655DF]" : "bg-transparent text-[#171C35] hover:bg-[#F5F6FB]"}`}
                    >
                      {l === "All" ? "All Levels" : LEVEL_LABELS[l]}
                      {levelFilter === l && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export CSV */}
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] bg-white hover:border-[#6655DF] hover:text-[#6655DF] transition-colors cursor-pointer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAFF] border-b border-[#DFE2ED]">
                {["Program", "Category", "Level", "Pricing", "Instructors", "Enrolled", ""].map((col, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#8A90A6] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {programsLoading ? (
                <TableSkeletonRows colSpan={7} />
              ) : filteredPrograms.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[#8A90A6]">{programs.length > 0 ? "No programmes match these filters." : "No programmes have been assigned to you yet."}</td></tr>
              ) : paginatedPrograms.map(p => (
                <tr key={p.id} className="border-b border-[#F0EFFA] last:border-none hover:bg-[#FAFAFF] transition-colors">

                  {/* Program info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.thumbnail ? (
                        <div className="relative w-9 h-9 rounded-[8px] overflow-hidden shrink-0 border border-[#DFE2ED]">
                          <Image src={p.thumbnail} alt={p.title} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-[8px] bg-[#EEECFF] flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6655DF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#171C35] leading-tight line-clamp-1">{p.title}</p>
                        <span className="flex flex-wrap gap-1 mt-1">
                          {p.submittedForReviewAt ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#EEECFF] text-[#6655DF] text-[9px] font-bold uppercase tracking-wide">Awaiting approval</span>
                          ) : p.status === "PUBLISHED" ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wide">Live</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wide">Draft</span>
                          )}
                        </span>
                        {p.featured && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#6655DF] mt-0.5">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.category
                      ? <span className="px-2 py-0.5 rounded-full bg-[#EEECFF] text-[#5143AD] text-[11px] font-semibold">{p.category.name}</span>
                      : <span className="text-[#8A90A6]">—</span>}
                  </td>

                  {/* Level */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${LEVEL_COLORS[p.level]}`}>
                      {LEVEL_LABELS[p.level]}
                    </span>
                  </td>

                  {/* Pricing */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[12px] font-semibold ${p.pricing === "free" ? "text-emerald-600" : "text-[#171C35]"}`}>
                      {fmtPrice(p.price, p.pricing)}
                    </span>
                    {p.pricing === "paid" && p.paymentType && (
                      <p className="text-[10px] text-[#8A90A6] capitalize mt-0.5">{p.paymentType.replace(/-/g, " ")}</p>
                    )}
                  </td>

                  {/* Instructors / Facilitators */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {facilitatorSummary(p)
                      ? <span className="text-[12px] text-[#171C35]">{facilitatorSummary(p)}</span>
                      : <span className="text-[#8A90A6]">—</span>}
                  </td>

                  {/* Enrolled */}
                  <td className="px-4 py-3 whitespace-nowrap text-[#69708A]">
                    {p._count.enrollments}
                  </td>

                  {/* Actions — the admin's row menu, minus assign / approve / delete */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex justify-end">
                      <RowActions label={`Actions for ${p.title}`} items={programActions(p)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden flex flex-col">
          {programsLoading ? (
            <SkeletonCardList />
          ) : filteredPrograms.length === 0 ? (
            <div className="px-4 py-10 text-center text-[#8A90A6] text-[13px]">{programs.length > 0 ? "No programmes match these filters." : "No programmes have been assigned to you yet."}</div>
          ) : paginatedPrograms.map(p => (
            <div key={p.id} className="px-4 py-4 border-b border-[#F0EFFA] last:border-none flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {p.thumbnail ? (
                  <div className="relative w-10 h-10 rounded-[8px] overflow-hidden shrink-0 border border-[#DFE2ED]">
                    <Image src={p.thumbnail} alt={p.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-[8px] bg-[#EEECFF] flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6655DF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#171C35] text-[14px] leading-tight">{p.title}</p>
                  <span className="flex flex-wrap gap-1 mt-1">
                    {p.submittedForReviewAt ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#EEECFF] text-[#6655DF] text-[9px] font-bold uppercase tracking-wide">Awaiting approval</span>
                    ) : p.status === "PUBLISHED" ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wide">Live</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wide">Draft</span>
                    )}
                  </span>
                  {p.featured && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#6655DF] mt-0.5">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      Featured
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {p.category && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EEECFF] text-[#5143AD] text-[11px] font-semibold">{p.category.name}</span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${LEVEL_COLORS[p.level]}`}>
                  {LEVEL_LABELS[p.level]}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.pricing === "free" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {fmtPrice(p.price, p.pricing)}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Instructors</dt>
                  <dd className="text-[#171C35] font-medium line-clamp-1">{facilitatorSummary(p) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Enrolled</dt>
                  <dd className="text-[#171C35] font-medium">{p._count.enrollments}</dd>
                </div>
                {p.pricing === "paid" && p.paymentType && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Payment</dt>
                    <dd className="text-[#171C35] font-medium capitalize">{p.paymentType.replace(/-/g, " ")}</dd>
                  </div>
                )}
              </dl>

              <div className="flex items-center justify-end pt-1">
                <RowActions label={`Actions for ${p.title}`} items={programActions(p)} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#FAFAFF] border-t border-[#DFE2ED]">
          <p className="text-[11px] text-[#8A90A6]">
            {filteredPrograms.length === 0 ? (
              <>Showing <span className="font-semibold text-[#69708A]">0</span> of <span className="font-semibold text-[#69708A]">{programs.length}</span> programs</>
            ) : (
              <>Showing <span className="font-semibold text-[#69708A]">{(page - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#69708A]">{Math.min(page * PAGE_SIZE, filteredPrograms.length)}</span> of <span className="font-semibold text-[#69708A]">{filteredPrograms.length}</span> {filteredPrograms.length === 1 ? "program" : "programs"}</>
            )}
          </p>
          {filteredPrograms.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Prev</button>
              <span className="text-[11px] font-semibold text-[#69708A] px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Next</button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {programModal !== null && (
        <ProgramModal
          program={programModal === "create" ? null : programModal}
          categories={categories}
          formats={formats}
          onSave={handleSaveProgram}
          onClose={() => setProgramModal(null)}
        />
      )}
      {submitProgram && (
        <SubmitForApprovalDialog
          program={submitProgram}
          onClose={() => setSubmitProgram(null)}
          onDone={() => { setSubmitProgram(null); fetchPrograms() }}
        />
      )}
    </div>
  )
}
