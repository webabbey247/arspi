// Types and small helpers shared by the programs list page and the
// programme editor (ProgramEditor.tsx).

// ── Types ─────────────────────────────────────────────────────────────────────

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

export type Category = {
  id:        string
  name:      string
  slug:      string
  createdAt: string
  _count:    { courses: number }
}

export type Program = {
  id:           string
  title:        string
  slug:         string
  excerpt:      string
  thumbnail:    string | null
  price:        number
  pricing:      string
  paymentType:  string | null
  level:        CourseLevel
  featured:     boolean
  status?:      "DRAFT" | "PUBLISHED" | "ARCHIVED"
  /** Set while this programme awaits an admin's approval. */
  submittedForReviewAt?: string | null
  instructorId: string
  instructor:   { id: string; email: string; profile: { firstName: string | null; lastName: string | null } | null }
  categoryId:   string | null
  category:     Category | null
  createdAt:    string
  updatedAt:    string
  _count:       { enrollments: number }

  tagline:            string | null
  duration:           string | null
  format:             string | null
  programFormatId?:   string | null
  startDate:          string | null
  endDate:            string | null
  cohortSize:         number | null
  rating:             number | null
  reviewCount:        number | null
  enrolledCount:      number | null
  countriesCount:     number | null
  overview:           string | null
  outlineIntro:       string | null
  targetAudience:     unknown | null
  learningObjectives: unknown | null
  curriculum:         unknown | null
  whatIsIncluded:     unknown | null
  faqs:               unknown | null
  facilitators:       unknown | null
}

export type FacilitatorItem = {
  /** Set for directory picks (components/facilitators). */
  facilitatorId?: string
  name:        string
  imageUrl:    string
  title:       string
  bio:         string
  credentials: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER:     "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED:     "Advanced",
}

export const LEVEL_COLORS: Record<CourseLevel, string> = {
  BEGINNER:     "bg-emerald-50 text-emerald-700",
  INTERMEDIATE: "bg-amber-50 text-amber-700",
  ADVANCED:     "bg-rose-50 text-rose-700",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function fmtPrice(price: number, pricing: string) {
  return pricing === "free" || price === 0 ? "Free" : `$${price.toLocaleString()}`
}

export function facilitatorSummary(p: Program): string {
  if (!Array.isArray(p.facilitators) || p.facilitators.length === 0) return ""
  const arr = p.facilitators as Record<string, unknown>[]
  const first = String(arr[0]?.name ?? "")
  if (arr.length === 1) return first
  return `${first} +${arr.length - 1}`
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

export const inputCls = "w-full px-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors resize-none"

export function Field({ label, hint, required, action, children }: { label: string; hint?: string; required?: boolean; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-bold text-[#69708A] uppercase tracking-[0.4px]">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          {hint && <span className="ml-1 text-[10px] font-normal normal-case text-[#8A90A6]">({hint})</span>}
        </label>
        {action}
      </div>
      {children}
    </div>
  )
}

export function AiBuilderTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-[10.5px] font-bold text-[#6655DF] hover:text-[#2C2368] uppercase tracking-[0.4px] cursor-pointer"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z"/></svg>
      AI Builder
    </button>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 cursor-pointer">
      <span className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-[#6655DF]" : "bg-[#D8DAE5]"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </span>
      <span className="text-[13px] font-medium text-[#171C35]">{label}</span>
    </button>
  )
}

