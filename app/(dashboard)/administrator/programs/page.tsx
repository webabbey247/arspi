"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { TableSkeletonRows, SkeletonCardList } from "@/components/ui/skeleton"
import { AdminPageHeader, EmptyState, RowActions, RowIcon, StatTile } from "@/components/admin/AdminKit"
import type { DropdownItem } from "@/components/ui/DropdownMenu"
import { useRouter } from "next/navigation"
import RubricManager from "@/components/rubrics/RubricManager"
import FacilitatorsManager from "@/components/facilitators/FacilitatorsManager"
import { DEFAULT_PROGRAMME_FACILITATOR, facilitatorsPayload as toFacilitatorsPayload } from "@/components/facilitators/types"
import AssignReviewModal from "@/components/admin/AssignReviewModal"
import dynamic from "next/dynamic"
import { type CourseLevel, type CourseStatus, type Category, type Program, type Tab, type Lookup, type LookupKind, LOOKUP_LABEL, LOOKUP_ENDPOINT, LOOKUP_RESPONSE_KEY, LEVEL_LABELS, LEVEL_COLORS, slugify, fmtDate, fmtPrice, instructorName, facilitatorSummary, inputCls, ConfirmDialog, intOr } from "./program-shared"
import { type ProgramFormValues } from "./ProgramEditor"

// The editor is heavy (rich-text editors, form + validation libraries) and
// only needed once a modal opens, so it loads on demand.
const ProgramModal = dynamic(() => import("./ProgramEditor").then(m => m.ProgramModal), { ssr: false })
const AiCourseBuilderModal = dynamic(() => import("./ProgramEditor").then(m => m.AiCourseBuilderModal), { ssr: false })


// ── Category modal ────────────────────────────────────────────────────────────

function CategoryModal({ category, onSave, onClose }: { category: Category | null; onSave: (name: string) => Promise<void>; onClose: () => void }) {
  const [name, setName]     = useState(category?.name ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError("")
    setSaving(true)
    try { await onSave(name.trim()) }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong.") }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171C35]/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] p-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-300">
              {category ? "Edit Category" : "New Category"}
            </div>
            <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-300 mt-0.5">
              {category ? "Update the category name." : "Create a new program category."}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/35 hover:text-white text-xl leading-none shrink-0 bg-[#EEECFF]/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Policy Research" className={inputCls} required />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer">
              {saving ? "Saving…" : category ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Lookup modal (Level / Format / Pricing) ───────────────────────────────────

function LookupModal({
  kind, item, onSave, onClose,
}: {
  kind:    LookupKind
  item:    Lookup | null
  onSave:  (name: string) => Promise<void>
  onClose: () => void
}) {
  const meta = LOOKUP_LABEL[kind]
  const [name, setName]     = useState(item?.name ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError("")
    setSaving(true)
    try { await onSave(name.trim()) }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong.") }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171C35]/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] p-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-300">
              {item ? `Edit ${meta.singular}` : `New ${meta.singular}`}
            </div>
            <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-300 mt-0.5">
              {item ? `Update the ${meta.singular.toLowerCase()} name.` : meta.description}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/35 hover:text-white text-xl leading-none shrink-0 bg-[#EEECFF]/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={meta.placeholder} className={inputCls} required />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer">
              {saving ? "Saving…" : item ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ── Lookup tab panel (Levels / Formats / Pricing) ─────────────────────────────

function LookupTab({
  kind, items, loading, search, setSearch,
  page, setPage, totalPages, paginated,
  onEdit, onDelete,
}: {
  kind:        LookupKind
  items:       Lookup[]
  loading:     boolean
  search:      string
  setSearch:   (v: string) => void
  page:        number
  setPage:     React.Dispatch<React.SetStateAction<number>>
  totalPages:  number
  paginated:   Lookup[]
  onEdit:      (item: Lookup) => void
  onDelete:    (item: Lookup) => void
}) {
  const meta = LOOKUP_LABEL[kind]
  const PAGE_SIZE = 20
  return (
    <div className="rounded-[16px] border border-[#DFE2ED] overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 bg-white border-b border-[#DFE2ED]">
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${meta.plural.toLowerCase()}…`} className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors" />
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#FAFAFF] border-b border-[#DFE2ED]">
              {["Name", "Slug", "Programs", "Created", ""].map(col => (
                <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#8A90A6] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows colSpan={5} />
            ) : paginated.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[#8A90A6]">No {meta.plural.toLowerCase()} yet.</td></tr>
            ) : paginated.map(item => (
              <tr key={item.id} className="border-b border-[#F0EFFA] last:border-none hover:bg-[#FAFAFF] transition-colors">
                <td className="px-4 py-3 font-semibold text-[#171C35] whitespace-nowrap">{item.name}</td>
                <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{item.slug}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded-full bg-[#F5F6FB] text-[#69708A] text-[11px] font-semibold">{item._count.courses}</span>
                </td>
                <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(item)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] hover:bg-amber-50 cursor-pointer transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => onDelete(item)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden flex flex-col">
        {loading ? (
          <SkeletonCardList />
        ) : paginated.length === 0 ? (
          <div className="px-4 py-10 text-center text-[#8A90A6] text-[13px]">No {meta.plural.toLowerCase()} yet.</div>
        ) : paginated.map(item => (
          <div key={item.id} className="px-4 py-4 border-b border-[#F0EFFA] last:border-none flex flex-col gap-3">
            <p className="font-semibold text-[#171C35] text-[14px] leading-tight">{item.name}</p>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-[#F5F6FB] text-[#69708A] text-[11px] font-semibold">
                {item._count.courses} {item._count.courses === 1 ? "program" : "programs"}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Slug</dt>
                <dd className="text-[#171C35] font-medium truncate">{item.slug}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Created</dt>
                <dd className="text-[#171C35] font-medium">{new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</dd>
              </div>
            </dl>

            <RowActions
              label={`Actions for ${item.name}`}
              items={[
                { label: "Edit",   icon: RowIcon.edit,  onSelect: () => onEdit(item) },
                { type: "separator" },
                { label: "Delete", icon: RowIcon.trash, danger: true, onSelect: () => onDelete(item) },
              ]}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#FAFAFF] border-t border-[#DFE2ED]">
        <p className="text-[11px] text-[#8A90A6]">
          {paginated.length === 0 ? (
            <>Showing <span className="font-semibold text-[#69708A]">0</span> of <span className="font-semibold text-[#69708A]">{items.length}</span> {meta.plural.toLowerCase()}</>
          ) : (
            <>Showing <span className="font-semibold text-[#69708A]">{(page - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#69708A]">{Math.min(page * PAGE_SIZE, items.length)}</span> of <span className="font-semibold text-[#69708A]">{items.length}</span> {meta.plural.toLowerCase()}</>
          )}
        </p>
        {paginated.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Prev</button>
            <span className="text-[11px] font-semibold text-[#69708A] px-2">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Next</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminProgramsPage() {
  // Fetch the editor in the background once the list is up, so the first
  // "Edit"/"New" opens instantly without it weighing on the initial load.
  useEffect(() => { void import("./ProgramEditor") }, [])

  const [tab, setTab] = useState<Tab>("programs")
  // Rubrics manage their own data; the header button bumps this to open the builder.
  const [rubricCreate, setRubricCreate] = useState(0)
  const [rubricCount, setRubricCount]   = useState<number | null>(null)
  const [facilitatorCreate, setFacilitatorCreate] = useState(0)
  const [facilitatorCount, setFacilitatorCount]   = useState<number | null>(null)

  // Programs
  const [programs, setPrograms]               = useState<Program[]>([])
  const [programsLoading, setProgramsLoading] = useState(true)
  const [search, setSearch]                   = useState("")
  const [levelFilter, setLevelFilter]         = useState<CourseLevel | "All">("All")
  const [pricingFilter, setPricingFilter]     = useState<"All" | "Free" | "Paid" | "Featured">("All")
  // "All", a category id, or "none" for programmes with no category.
  const [categoryFilter, setCategoryFilter]   = useState<string>("All")
  const [categoryOpen, setCategoryOpen]       = useState(false)
  const categoryRef                           = useRef<HTMLDivElement>(null)
  const [programModal, setProgramModal]       = useState<"create" | "ai" | Program | null>(null)
  // Set while the full record for the editor is being fetched.
  const [hydratingId, setHydratingId]         = useState<string | null>(null)
  const [aiDraft, setAiDraft]                 = useState<Partial<ProgramFormValues> | null>(null)
  const [aiBuilderOpen, setAiBuilderOpen]     = useState(false)
  const [deleteProgram, setDeleteProgram]     = useState<Program | null>(null)
  const [assignProgram, setAssignProgram]     = useState<Program | null>(null)
  const [filterOpen, setFilterOpen]           = useState(false)
  const [statusOpen, setStatusOpen]           = useState(false)
  const filterRef                             = useRef<HTMLDivElement>(null)
  const statusRef                             = useRef<HTMLDivElement>(null)
  const PAGE_SIZE                             = 20
  const [page, setPage]                       = useState(1)
  const [categoriesPage, setCategoriesPage]   = useState(1)

  // Categories
  const [categories, setCategories]                 = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading]   = useState(true)
  const [categorySearch, setCategorySearch]         = useState("")
  const [categoryModal, setCategoryModal]           = useState<"create" | Category | null>(null)
  const [deleteCategory, setDeleteCategory]         = useState<Category | null>(null)

  // Levels / Formats / Pricing — lookup tables
  const [levels, setLevels]                   = useState<Lookup[]>([])
  const [levelsLoading, setLevelsLoading]     = useState(true)
  const [levelSearch, setLevelSearch]         = useState("")
  const [levelModal, setLevelModal]           = useState<"create" | Lookup | null>(null)
  const [deleteLevel, setDeleteLevel]         = useState<Lookup | null>(null)
  const [levelsPage, setLevelsPage]           = useState(1)

  const [formats, setFormats]                 = useState<Lookup[]>([])
  const [formatsLoading, setFormatsLoading]   = useState(true)
  const [formatSearch, setFormatSearch]       = useState("")
  const [formatModal, setFormatModal]         = useState<"create" | Lookup | null>(null)
  const [deleteFormat, setDeleteFormat]       = useState<Lookup | null>(null)
  const [formatsPage, setFormatsPage]         = useState(1)

  const [pricingList, setPricingList]         = useState<Lookup[]>([])
  const [pricingLoading, setPricingLoading]   = useState(true)
  const [pricingSearch, setPricingSearch]     = useState("")
  const [pricingModal, setPricingModal]       = useState<"create" | Lookup | null>(null)
  const [deletePricing, setDeletePricing]     = useState<Lookup | null>(null)
  const router = useRouter()
  const [pricingPage, setPricingPage]         = useState(1)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPrograms = useCallback(async () => {
    setProgramsLoading(true)
    try {
      const r = await fetch("/api/programs")
      const d = await r.json()
      if (r.ok) setPrograms(d.programs ?? [])
    } finally {
      setProgramsLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const r = await fetch("/api/programs/categories")
      const d = await r.json()
      if (r.ok) setCategories(d.categories ?? [])
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  const fetchLookup = useCallback(async (kind: LookupKind) => {
    const setLoading = kind === "level" ? setLevelsLoading : kind === "format" ? setFormatsLoading : setPricingLoading
    const setData    = kind === "level" ? setLevels       : kind === "format" ? setFormats       : setPricingList
    setLoading(true)
    try {
      const r = await fetch(LOOKUP_ENDPOINT[kind])
      const d = await r.json()
      if (r.ok) setData(d[LOOKUP_RESPONSE_KEY[kind]] ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLevels   = useCallback(() => fetchLookup("level"),   [fetchLookup])
  const fetchFormats  = useCallback(() => fetchLookup("format"),  [fetchLookup])
  const fetchPricing  = useCallback(() => fetchLookup("pricing"), [fetchLookup])

  useEffect(() => {
    fetchPrograms()
    fetchCategories()
    fetchLevels()
    fetchFormats()
    fetchPricing()
  }, [fetchPrograms, fetchCategories, fetchLevels, fetchFormats, fetchPricing])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setCategoryOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => { setPage(1) }, [search, levelFilter, pricingFilter, categoryFilter])
  useEffect(() => { setCategoriesPage(1) }, [categorySearch])
  useEffect(() => { setLevelsPage(1) },     [levelSearch])
  useEffect(() => { setFormatsPage(1) },    [formatSearch])
  useEffect(() => { setPricingPage(1) },    [pricingSearch])

  // ── CSV export ─────────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = ["Title", "Slug", "Category", "Level", "Pricing", "Price", "Instructor", "Facilitators", "Enrolled", "Featured", "Created"]
    const rows = filteredPrograms.map(p => [
      `"${p.title.replace(/"/g, '""')}"`,
      p.slug,
      p.category?.name ?? "",
      LEVEL_LABELS[p.level],
      p.pricing,
      fmtPrice(p.price, p.pricing),
      instructorName(p),
      `"${facilitatorSummary(p).replace(/"/g, '""')}"`,
      String(p._count.enrollments),
      p.featured ? "Yes" : "No",
      fmtDate(p.createdAt),
    ])
    const csv  = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `programs-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Program CRUD ──────────────────────────────────────────────────────────

  function filterArr(arr: string[]): string[] | null {
    const f = arr.filter(s => s.trim())
    return f.length > 0 ? f : null
  }

  async function handleSaveProgram(values: ProgramFormValues) {
    const editing = programModal !== "create" && programModal !== "ai" ? programModal : null

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
            // Was omitted here, so an authored duration was discarded on every
            // save and the player silently fell back to its estimate.
            estimatedMinutes: l.estimatedMinutes ?? null,
            ...(l.focus        && { focus:        l.focus }),
            ...(l.brief        && { brief:        l.brief }),
            ...(l.mustCover?.length    && { mustCover:    l.mustCover }),
            ...(l.mustNotCover?.length && { mustNotCover: l.mustNotCover }),
          })),
      }))

    // Directory picks carry facilitatorId; the server re-reads them from the directory.
    const facilitatorsPayload = toFacilitatorsPayload(values.facilitators)

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
      predefinedAnalytics: values.predefinedAnalytics,
      ...(programModal === "ai" && !editing && { status: "DRAFT" as const }),

      programLevelId:   values.programLevelId   || null,
      programFormatId:  values.programFormatId  || null,
      programPricingId: values.programPricingId || null,

      tagline:        values.tagline       || null,
      duration:       values.duration      || null,
      format:         values.format        || null,
      startDate:      values.startDate     || null,
      endDate:        values.endDate       || null,
      cohortSize:     values.cohortSize     ? parseInt(values.cohortSize)    : null,
      rating:         values.predefinedAnalytics && values.rating         ? parseFloat(values.rating)       : null,
      reviewCount:    values.predefinedAnalytics && values.reviewCount    ? parseInt(values.reviewCount)    : null,
      enrolledCount:  values.predefinedAnalytics && values.enrolledCount  ? parseInt(values.enrolledCount)  : null,
      countriesCount: values.predefinedAnalytics && values.countriesCount ? parseInt(values.countriesCount) : null,

      overview:           values.overview || null,
      outlineIntro:       values.outlineIntro?.trim() || null,
      targetAudience:     filterArr(values.targetAudience),
      learningObjectives: filterArr(values.learningObjectives),
      whatIsIncluded:     filterArr(values.whatIsIncluded),
      curriculum:         curriculumPayload.length   > 0 ? curriculumPayload   : null,
      // Never null: a programme without authored facilitators is credited to
      // the institute rather than showing nobody.
      facilitators:       facilitatorsPayload.length > 0 ? facilitatorsPayload : toFacilitatorsPayload([DEFAULT_PROGRAMME_FACILITATOR]),

      gradingEnabled:          values.gradingEnabled,
      quizWeight:              intOr(values.quizWeight, 50),
      projectWeight:           intOr(values.projectWeight, 50),
      passMark:                intOr(values.passMark, 50),
      componentPassMark:       intOr(values.componentPassMark, 50),
      maxQuizAttempts:         intOr(values.maxQuizAttempts, 3),
      attemptCooldownHours:    intOr(values.attemptCooldownHours, 24),
      maxProjectResubmissions: intOr(values.maxProjectResubmissions, 2),
      faqs:               faqsPayload.length         > 0 ? faqsPayload         : null,
    }
    const res  = await fetch(editing ? `/api/programs/${editing.id}` : "/api/programs", {
      method:  editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save program.")
    setProgramModal(null)
    setAiDraft(null)
    await fetchPrograms()
  }

  async function handleDeleteProgram() {
    if (!deleteProgram) return
    const res = await fetch(`/api/programs/${deleteProgram.id}`, { method: "DELETE" })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? "Failed to delete program.")
      return
    }
    setDeleteProgram(null)
    await fetchPrograms()
  }

  /** Opens the editor on the *full* record.
   *
   *  The table is loaded from a narrow query that omits curriculum, overview,
   *  faqs and facilitators. Handing that row to the modal would populate the
   *  form with empty values for all of them and then write those blanks back
   *  on save — losing the content silently. So fetch by id first. */
  async function openProgramEditor(p: Program) {
    setHydratingId(p.id)
    try {
      const res = await fetch(`/api/programs/${p.id}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? "Could not open that programme for editing.")
        return
      }
      const { program } = await res.json()
      setProgramModal(program as Program)
    } catch {
      toast.error("Could not open that programme for editing.")
    } finally {
      setHydratingId(null)
    }
  }

  async function handleSetProgramStatus(p: Program, status: CourseStatus) {
    const res = await fetch(`/api/programs/${p.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? "Failed to update program status.")
      return
    }
    toast.success(
      status === "PUBLISHED"
        ? `"${p.title}" is now live.`
        : `"${p.title}" has been archived back to draft and is off the public site.`
    )
    await fetchPrograms()
  }

  /** Menu contents depend on where the programme sits in its lifecycle:
   *  a draft can be approved to go live, and a live programme can be archived
   *  straight back to draft — so the pair is a round trip, not a dead end. */
  function programActions(p: Program): DropdownItem[] {
    // Navigation items use onSelect rather than an href: the shared menu takes
    // one item shape, and routing here keeps every row menu identical.
    const actions: DropdownItem[] = [
      { label: "View analytics", onSelect: () => router.push(`/administrator/programs/${p.slug}`), icon: RowIcon.analytics },
      { label: "View public page", onSelect: () => window.open(`/programs/${p.slug}`, "_blank", "noopener,noreferrer"), icon: RowIcon.view },
      {
        // The editor needs a round trip to fetch the full record, so say so
        // rather than appearing to do nothing on a slow connection.
        label:    hydratingId === p.id ? "Opening…" : "Edit programme",
        onSelect: () => openProgramEditor(p),
        icon:     RowIcon.edit,
      },
      {
        label:       p.instructorId ? "Reassign…" : "Assign for review…",
        onSelect:    () => setAssignProgram(p),
        icon:        RowIcon.user,
      },
    ]
    if (p.status === "DRAFT") {
      actions.push({
        label:    "Approve programme",
        onSelect: () => handleSetProgramStatus(p, "PUBLISHED"),
        icon:     RowIcon.publish,
      })
    } else {
      actions.push({
        label:    "Archive programme",
        onSelect: () => handleSetProgramStatus(p, "DRAFT"),
        icon:     RowIcon.archive,
      })
    }
    actions.push({ type: "separator" })
    actions.push({ label: "Delete programme", onSelect: () => setDeleteProgram(p), icon: RowIcon.trash, danger: true })
    return actions
  }

  // ── Category CRUD ──────────────────────────────────────────────────────────

  async function handleSaveCategory(name: string) {
    const editing = categoryModal !== "create" ? categoryModal : null
    const res  = await fetch(
      editing ? `/api/programs/categories/${editing.id}` : "/api/programs/categories",
      {
        method:  editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name }),
      }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save category.")
    setCategoryModal(null)
    await fetchCategories()
  }

  async function handleDeleteCategory() {
    if (!deleteCategory) return
    const res = await fetch(`/api/programs/categories/${deleteCategory.id}`, { method: "DELETE" })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error ?? "Failed to delete.")
      return
    }
    setDeleteCategory(null)
    await fetchCategories()
  }

  // ── Derived ────────────────────────────────────────────────────────────────

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
      instructorName(p).toLowerCase().includes(q) ||
      facilitatorSummary(p).toLowerCase().includes(q) ||
      (p.category?.name ?? "").toLowerCase().includes(q)
    )
  })

  // ── Lookup CRUD (Levels / Formats / Pricing) ──────────────────────────────

  function lookupContextFor(kind: LookupKind) {
    if (kind === "level")   return { modal: levelModal,   setModal: setLevelModal,   refetch: fetchLevels,  toDelete: deleteLevel,   setToDelete: setDeleteLevel,   resKey: "level" as const }
    if (kind === "format")  return { modal: formatModal,  setModal: setFormatModal,  refetch: fetchFormats, toDelete: deleteFormat,  setToDelete: setDeleteFormat,  resKey: "format" as const }
    return                       { modal: pricingModal, setModal: setPricingModal, refetch: fetchPricing, toDelete: deletePricing, setToDelete: setDeletePricing, resKey: "pricing" as const }
  }

  async function handleSaveLookup(kind: LookupKind, name: string) {
    const ctx     = lookupContextFor(kind)
    const editing = ctx.modal !== "create" ? ctx.modal : null
    const url     = editing ? `${LOOKUP_ENDPOINT[kind]}/${editing.id}` : LOOKUP_ENDPOINT[kind]
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? `Failed to save ${LOOKUP_LABEL[kind].singular.toLowerCase()}.`)
    ctx.setModal(null)
    await ctx.refetch()
  }

  async function handleDeleteLookup(kind: LookupKind) {
    const ctx = lookupContextFor(kind)
    if (!ctx.toDelete) return
    const res = await fetch(`${LOOKUP_ENDPOINT[kind]}/${ctx.toDelete.id}`, { method: "DELETE" })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? "Failed to delete.")
      return
    }
    ctx.setToDelete(null)
    await ctx.refetch()
  }

  const filteredCategories = categories.filter(c =>
    !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const totalPages       = Math.max(1, Math.ceil(filteredPrograms.length / PAGE_SIZE))
  const paginatedPrograms = filteredPrograms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalCategoryPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE))
  const paginatedCategories = filteredCategories.slice((categoriesPage - 1) * PAGE_SIZE, categoriesPage * PAGE_SIZE)

  const filteredLevels  = levels.filter(l => !levelSearch || l.name.toLowerCase().includes(levelSearch.toLowerCase()))
  const filteredFormats = formats.filter(f => !formatSearch || f.name.toLowerCase().includes(formatSearch.toLowerCase()))
  const filteredPricing = pricingList.filter(p => !pricingSearch || p.name.toLowerCase().includes(pricingSearch.toLowerCase()))

  const totalLevelPages   = Math.max(1, Math.ceil(filteredLevels.length / PAGE_SIZE))
  const totalFormatPages  = Math.max(1, Math.ceil(filteredFormats.length / PAGE_SIZE))
  const totalPricingPages = Math.max(1, Math.ceil(filteredPricing.length / PAGE_SIZE))

  const paginatedLevels   = filteredLevels.slice((levelsPage  - 1) * PAGE_SIZE, levelsPage  * PAGE_SIZE)
  const paginatedFormats  = filteredFormats.slice((formatsPage - 1) * PAGE_SIZE, formatsPage * PAGE_SIZE)
  const paginatedPricing  = filteredPricing.slice((pricingPage - 1) * PAGE_SIZE, pricingPage * PAGE_SIZE)

  const statusCounts = {
    published: programs.filter(p => p.status === "PUBLISHED").length,
    draft:     programs.filter(p => p.status === "DRAFT").length,
  }
  const totalEnrolments = programs.reduce((sum, p) => sum + (p._count?.enrollments ?? 0), 0)

  const counts = {
    all:      programs.length,
    free:     programs.filter(p => p.pricing === "free").length,
    paid:     programs.filter(p => p.pricing === "paid").length,
    featured: programs.filter(p => p.featured).length,
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">

      {/* Page header */}
      <AdminPageHeader
        title="Programs"
        description="Learning programmes and the lookups that classify them."
        actions={<>
          {tab === "programs" && (
            <button
              onClick={() => setAiBuilderOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#6655DF] text-[#6655DF] bg-white hover:bg-[#EEECFF] transition-colors cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z"/></svg>
              AI Program Builder
            </button>
          )}
          <button
            onClick={() => {
              if (tab === "programs")   setProgramModal("create")
              else if (tab === "categories") setCategoryModal("create")
              else if (tab === "levels")     setLevelModal("create")
              else if (tab === "facilitators") setFacilitatorCreate(n => n + 1)
              else if (tab === "rubrics")    setRubricCreate(n => n + 1)
              else if (tab === "formats")    setFormatModal("create")
              else                           setPricingModal("create")
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {tab === "programs"   ? "New Program"
             : tab === "categories" ? "New Category"
             : tab === "levels"     ? "New Level"
             : tab === "facilitators" ? "New Facilitator"
             : tab === "rubrics"    ? "New Rubric"
             : tab === "formats"    ? "New Format"
             :                        "New Pricing"}
          </button>
        </>}
      />

      {/* Stat strip — only on the programmes tab; the lookup tabs are short
          lists where a counts row would say less than the list itself. */}
      {tab === "programs" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 mt-6">
          <StatTile
            label="Programmes" value={programs.length} loading={programsLoading}
            motif="dots"  accent="text-[#6655DF]"
            tone="bg-[#EEECFF] text-[#6655DF]"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
            breakdown={[
              { label: "live",  value: statusCounts.published, tone: "emerald" },
              { label: "draft", value: statusCounts.draft,     tone: "amber" },
            ]}
          />
          <StatTile
            label="Enrolments" value={totalEnrolments} loading={programsLoading}
            motif="waves" accent="text-sky-600"
            hint="Across every programme"
            tone="bg-sky-50 text-sky-600"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
          />
          <StatTile
            label="Pricing" value={`${counts.free} free`} loading={programsLoading}
            motif="hatch" accent="text-emerald-600"
            tone="bg-emerald-50 text-emerald-600"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            breakdown={[{ label: "paid", value: counts.paid, tone: "slate" }]}
          />
          <StatTile
            label="Featured" value={counts.featured} loading={programsLoading}
            motif="rings" accent="text-amber-600"
            hint="Shown first on the public site"
            tone="bg-amber-50 text-amber-600"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          />
        </div>
      )}

      {/* Tabs — formats / pricing intentionally hidden until those features ship */}
      <div className="flex gap-1 mb-5 bg-[#F5F6FB] rounded-[12px] p-1 overflow-x-auto sm:overflow-x-visible sm:w-fit sm:flex-wrap">
        {(["programs", "categories", "levels", "facilitators", "rubrics"] as Tab[]).map(t => {
          const count =
            t === "programs"   ? programs.length :
            t === "categories" ? categories.length :
            t === "levels"     ? levels.length :
            t === "facilitators" ? (facilitatorCount ?? "…") :
            t === "rubrics"    ? (rubricCount ?? "…") :
            t === "formats"    ? formats.length :
                                 pricingList.length
          return (
            <button key={t} onClick={() => setTab(t)} className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-[9px] text-[13px] font-semibold capitalize transition-colors cursor-pointer ${tab === t ? "bg-white text-[#171C35] shadow-sm" : "text-[#69708A] hover:text-[#171C35]"}`}>
              {t}
              <span className="ml-1 font-normal text-[#8A90A6]">({count})</span>
            </button>
          )
        })}
      </div>

      {/* ── PROGRAMS TAB ──────────────────────────────────────────────────────── */}
      {tab === "programs" && (
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

              {/* Category filter */}
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
                      {categoryFilter === "none" ? "None" : categories.find(c => c.id === categoryFilter)?.name ?? "—"}
                    </span>
                  )}
                </button>
                {categoryOpen && (
                  <div role="listbox" className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#DFE2ED] rounded-xl shadow-lg py-1.5 min-w-52 max-h-72 overflow-y-auto">
                    {[
                      { id: "All",  name: "All Categories", count: programs.length },
                      ...categories.map(c => ({ id: c.id, name: c.name, count: programs.filter(p => p.categoryId === c.id).length })),
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

              {/* Level filter */}
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
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-[14px] font-bold text-[#8A90A6]">
                    {search.trim() || pricingFilter !== "All" || levelFilter !== "All" || categoryFilter !== "All"
                      ? "No programmes match those filters."
                      : "No programmes yet."}
                  </td></tr>
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
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-[#171C35] leading-tight line-clamp-1">{p.title}</p>
                            {p.status === "DRAFT" && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wide">Draft</span>
                            )}
                            {p.submittedForReviewAt && (
                              <span title={p.submissionNote ?? undefined} className="shrink-0 px-1.5 py-0.5 rounded-full bg-[#EEECFF] text-[#6655DF] text-[9px] font-bold uppercase tracking-wide">Awaiting approval</span>
                            )}
                          </div>
                          <p className={`text-[11px] mt-0.5 ${p.instructor ? "text-[#8A90A6]" : "text-amber-700 font-semibold"}`}>
                            {p.instructor ? instructorName(p) : "Unassigned — use “Assign for review”"}
                          </p>
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

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <RowActions items={programActions(p)} label={`Actions for ${p.title}`} />
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
              <EmptyState
                className="border-0 rounded-none"
                title={search.trim() || pricingFilter !== "All" || levelFilter !== "All" || categoryFilter !== "All"
                  ? "No programmes match those filters."
                  : "No programmes yet."}
                hint="Create one by hand, or let the AI Program Builder draft the whole curriculum."
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
              />
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
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-[#171C35] text-[14px] leading-tight line-clamp-2">{p.title}</p>
                      {p.status === "DRAFT" && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wide">Draft</span>
                      )}
                      {p.submittedForReviewAt && (
                              <span title={p.submissionNote ?? undefined} className="shrink-0 px-1.5 py-0.5 rounded-full bg-[#EEECFF] text-[#6655DF] text-[9px] font-bold uppercase tracking-wide">Awaiting approval</span>
                            )}
                    </div>
                    <p className={`text-[12px] mt-0.5 truncate ${p.instructor ? "text-[#8A90A6]" : "text-amber-700 font-semibold"}`}>
                      {p.instructor ? instructorName(p) : "Unassigned"}
                    </p>
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
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Instructors</dt>
                    <dd className="text-[#171C35] font-medium truncate">{facilitatorSummary(p) || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Enrolled</dt>
                    <dd className="text-[#171C35] font-medium">{p._count.enrollments}</dd>
                  </div>
                  {p.pricing === "paid" && p.paymentType && (
                    <div className="col-span-2">
                      <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Payment</dt>
                      <dd className="text-[#171C35] font-medium capitalize">{p.paymentType.replace(/-/g, " ")}</dd>
                    </div>
                  )}
                </dl>

                <div className="flex items-center justify-end pt-1">
                  <RowActions items={programActions(p)} label={`Actions for ${p.title}`} />
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
      )}

      {/* ── CATEGORIES TAB ────────────────────────────────────────────────────── */}
      {tab === "categories" && (
        <div className="rounded-[16px] border border-[#DFE2ED] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 bg-white border-b border-[#DFE2ED]">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="Search categories…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors" />
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAFF] border-b border-[#DFE2ED]">
                  {["Name", "Slug", "Programs", "Created", ""].map(col => (
                    <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#8A90A6] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoriesLoading ? (
                  <TableSkeletonRows colSpan={5} />
                ) : filteredCategories.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[#8A90A6]">No categories yet.</td></tr>
                ) : paginatedCategories.map(cat => (
                  <tr key={cat.id} className="border-b border-[#F0EFFA] last:border-none hover:bg-[#FAFAFF] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#171C35] whitespace-nowrap">{cat.name}</td>
                    <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{cat.slug}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 rounded-full bg-[#F5F6FB] text-[#69708A] text-[11px] font-semibold">{cat._count.courses}</span></td>
                    <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{fmtDate(cat.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCategoryModal(cat)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] hover:bg-amber-50 cursor-pointer transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteCategory(cat)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden flex flex-col">
            {categoriesLoading ? (
              <SkeletonCardList />
            ) : filteredCategories.length === 0 ? (
              <div className="px-4 py-10 text-center text-[#8A90A6] text-[13px]">No categories yet.</div>
            ) : paginatedCategories.map(cat => (
              <div key={cat.id} className="px-4 py-4 border-b border-[#F0EFFA] last:border-none flex flex-col gap-3">
                <p className="font-semibold text-[#171C35] text-[14px] leading-tight">{cat.name}</p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#F5F6FB] text-[#69708A] text-[11px] font-semibold">
                    {cat._count.courses} {cat._count.courses === 1 ? "program" : "programs"}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Slug</dt>
                    <dd className="text-[#171C35] font-medium truncate">{cat.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Created</dt>
                    <dd className="text-[#171C35] font-medium">{fmtDate(cat.createdAt)}</dd>
                  </div>
                </dl>

                <RowActions
                  label={`Actions for ${cat.name}`}
                  items={[
                    { label: "Edit category",   icon: RowIcon.edit,  onSelect: () => setCategoryModal(cat) },
                    { type: "separator" },
                    { label: "Delete category", icon: RowIcon.trash, danger: true, onSelect: () => setDeleteCategory(cat) },
                  ]}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#FAFAFF] border-t border-[#DFE2ED]">
            <p className="text-[11px] text-[#8A90A6]">
              {filteredCategories.length === 0 ? (
                <>Showing <span className="font-semibold text-[#69708A]">0</span> of <span className="font-semibold text-[#69708A]">{categories.length}</span> categories</>
              ) : (
                <>Showing <span className="font-semibold text-[#69708A]">{(categoriesPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#69708A]">{Math.min(categoriesPage * PAGE_SIZE, filteredCategories.length)}</span> of <span className="font-semibold text-[#69708A]">{filteredCategories.length}</span> {filteredCategories.length === 1 ? "category" : "categories"}</>
              )}
            </p>
            {filteredCategories.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCategoriesPage(p => Math.max(1, p - 1))} disabled={categoriesPage === 1} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Prev</button>
                <span className="text-[11px] font-semibold text-[#69708A] px-2">{categoriesPage} / {totalCategoryPages}</span>
                <button onClick={() => setCategoriesPage(p => Math.min(totalCategoryPages, p + 1))} disabled={categoriesPage >= totalCategoryPages} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "levels" && (
        <LookupTab
          kind="level"
          items={levels}
          loading={levelsLoading}
          search={levelSearch} setSearch={setLevelSearch}
          page={levelsPage} setPage={setLevelsPage}
          totalPages={totalLevelPages}
          paginated={paginatedLevels}
          onEdit={(item) => setLevelModal(item)}
          onDelete={(item) => setDeleteLevel(item)}
        />
      )}

      {/* Always mounted (hidden off-tab) so the tab shows its count. */}
      <div hidden={tab !== "facilitators"}>
        <FacilitatorsManager createRequest={facilitatorCreate} onCount={setFacilitatorCount} />
      </div>

      {/* Always mounted (hidden off-tab) so the tab shows its count and the
          builder's state survives tab switches. */}
      <div hidden={tab !== "rubrics"}>
        <RubricManager createRequest={rubricCreate} onCount={setRubricCount} />
      </div>

      {tab === "formats" && (
        <LookupTab
          kind="format"
          items={formats}
          loading={formatsLoading}
          search={formatSearch} setSearch={setFormatSearch}
          page={formatsPage} setPage={setFormatsPage}
          totalPages={totalFormatPages}
          paginated={paginatedFormats}
          onEdit={(item) => setFormatModal(item)}
          onDelete={(item) => setDeleteFormat(item)}
        />
      )}

      {tab === "pricing" && (
        <LookupTab
          kind="pricing"
          items={pricingList}
          loading={pricingLoading}
          search={pricingSearch} setSearch={setPricingSearch}
          page={pricingPage} setPage={setPricingPage}
          totalPages={totalPricingPages}
          paginated={paginatedPricing}
          onEdit={(item) => setPricingModal(item)}
          onDelete={(item) => setDeletePricing(item)}
        />
      )}

      {/* Modals */}
      {programModal !== null && (
        <ProgramModal
          program={programModal === "create" || programModal === "ai" ? null : programModal}
          initialValues={programModal === "ai" ? aiDraft ?? undefined : undefined}
          aiGenerated={programModal === "ai"}
          categories={categories}
          levels={levels}
          formats={formats}
          pricingOptions={pricingList}
          onSave={handleSaveProgram}
          onClose={() => { setProgramModal(null); setAiDraft(null) }}
        />
      )}
      {aiBuilderOpen && (
        <AiCourseBuilderModal
          categories={categories}
          onClose={() => setAiBuilderOpen(false)}
          onGenerated={draft => {
            setAiDraft(draft)
            setAiBuilderOpen(false)
            setProgramModal("ai")
          }}
        />
      )}
      {categoryModal !== null && (
        <CategoryModal category={categoryModal === "create" ? null : categoryModal} onSave={handleSaveCategory} onClose={() => setCategoryModal(null)} />
      )}
      {levelModal !== null && (
        <LookupModal kind="level" item={levelModal === "create" ? null : levelModal} onSave={(name) => handleSaveLookup("level", name)} onClose={() => setLevelModal(null)} />
      )}
      {formatModal !== null && (
        <LookupModal kind="format" item={formatModal === "create" ? null : formatModal} onSave={(name) => handleSaveLookup("format", name)} onClose={() => setFormatModal(null)} />
      )}
      {pricingModal !== null && (
        <LookupModal kind="pricing" item={pricingModal === "create" ? null : pricingModal} onSave={(name) => handleSaveLookup("pricing", name)} onClose={() => setPricingModal(null)} />
      )}
      {assignProgram && (
        <AssignReviewModal program={assignProgram} onClose={() => setAssignProgram(null)} onDone={fetchPrograms} />
      )}
      {deleteProgram && (
        <ConfirmDialog message={`Delete "${deleteProgram.title}"? This cannot be undone.`} onConfirm={handleDeleteProgram} onCancel={() => setDeleteProgram(null)} />
      )}
      {deleteCategory && (
        <ConfirmDialog message={`Delete category "${deleteCategory.name}"? This cannot be undone.`} onConfirm={handleDeleteCategory} onCancel={() => setDeleteCategory(null)} />
      )}
      {deleteLevel && (
        <ConfirmDialog message={`Delete level "${deleteLevel.name}"? This cannot be undone.`} onConfirm={() => handleDeleteLookup("level")} onCancel={() => setDeleteLevel(null)} />
      )}
      {deleteFormat && (
        <ConfirmDialog message={`Delete format "${deleteFormat.name}"? This cannot be undone.`} onConfirm={() => handleDeleteLookup("format")} onCancel={() => setDeleteFormat(null)} />
      )}
      {deletePricing && (
        <ConfirmDialog message={`Delete pricing option "${deletePricing.name}"? This cannot be undone.`} onConfirm={() => handleDeleteLookup("pricing")} onCancel={() => setDeletePricing(null)} />
      )}
    </div>
  )
}
