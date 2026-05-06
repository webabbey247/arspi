"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import RichTextEditor from "@/components/ui/RichTextEditor"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "jobs" | "departments"

type Department = {
  id:        string
  name:      string
  createdAt: string
}

type CareerType      = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY"
type ExperienceLevel = "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE"
type CareerStatus    = "PUBLISHED" | "ARCHIVED"

type Career = {
  id:              string
  title:           string
  slug:            string
  department:      string
  type:            CareerType
  experienceLevel: ExperienceLevel
  location:        string
  remote:          boolean
  salaryMin:       number | null
  salaryMax:       number | null
  currency:        string
  description:     string
  responsibilities: unknown | null
  requirements:    unknown | null
  benefits:        unknown | null
  applyEmail:      string | null
  status:          CareerStatus
  views:           number
  applications:    number
  closingDate:     string | null
  createdAt:       string
  updatedAt:       string
}

const TYPE_LABELS: Record<CareerType, string> = {
  FULL_TIME:  "Full-time",
  PART_TIME:  "Part-time",
  CONTRACT:   "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY:  "Temporary",
}

const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  ENTRY:     "Entry",
  JUNIOR:    "Junior",
  MID:       "Mid-Level",
  SENIOR:    "Senior",
  LEAD:      "Lead",
  EXECUTIVE: "Executive",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function asArr(val: unknown): string[] {
  return Array.isArray(val) ? (val as string[]) : []
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors resize-none"

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-[#6B6560] uppercase tracking-[0.4px]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="ml-1 text-[10px] font-normal normal-case text-[#A8A39C]">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 cursor-pointer">
      <span className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-[#0474C4]" : "bg-[#D9D6D0]"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </span>
      <span className="text-[13px] font-medium text-[#1A1916]">{label}</span>
    </button>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <p className="text-[14px] text-[#1A1916] mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer">Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ── Tag-list input (used for responsibilities, requirements, benefits) ────────

function TagListInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("")

  function add() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onChange([...value, trimmed])
    setDraft("")
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button type="button" onClick={add} className="px-3 py-2 rounded-[10px] text-[12px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] cursor-pointer">Add</button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((item, i) => (
            <li key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] bg-[#F5F4F1] text-[12px] text-[#1A1916]">
              <span className="flex-1">{item}</span>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-[#A8A39C] hover:text-red-500 cursor-pointer">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Form values ───────────────────────────────────────────────────────────────

type CareerFormValues = {
  title:           string
  slug:            string
  department:      string
  type:            CareerType
  experienceLevel: ExperienceLevel
  location:        string
  remote:          boolean
  salaryEnabled:   boolean
  salaryMin:       string
  salaryMax:       string
  currency:        string
  description:     string
  responsibilities: string[]
  requirements:    string[]
  benefits:        string[]
  applyEmail:      string
  closingDate:     string
}

const careerSchema = yup.object({
  title:           yup.string().trim().min(2).max(255).required("Title is required"),
  slug:            yup.string().trim().min(2).max(255)
                      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase, numbers and hyphens only")
                      .required("Slug is required"),
  department:      yup.string().trim().min(1).max(120).required("Department is required"),
  type:            yup.string().oneOf(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"] as const).required(),
  experienceLevel: yup.string().oneOf(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"] as const).required(),
  location:        yup.string().trim().min(1).max(120).required("Location is required"),
  remote:          yup.boolean().required().default(false),
  salaryEnabled:   yup.boolean().required().default(false),
  salaryMin:       yup.string().default("").when("salaryEnabled", {
                      is: true,
                      then: (s) => s.required("Required").matches(/^\d+(\.\d+)?$/, "Must be a number"),
                      otherwise: (s) => s.default(""),
                   }),
  salaryMax:       yup.string().default("").when("salaryEnabled", {
                      is: true,
                      then: (s) => s.required("Required").matches(/^\d+(\.\d+)?$/, "Must be a number"),
                      otherwise: (s) => s.default(""),
                   }),
  currency:        yup.string().max(10).default("USD").when("salaryEnabled", {
                      is: true,
                      then: (s) => s.required("Required"),
                      otherwise: (s) => s.default("USD"),
                   }),
  description:     yup.string().trim().min(10, "At least 10 characters").required("Description is required"),
  responsibilities: yup.array().of(yup.string().required()).required().default([]),
  requirements:    yup.array().of(yup.string().required()).required().default([]),
  benefits:        yup.array().of(yup.string().required()).required().default([]),
  applyEmail:      yup.string().default(""),
  closingDate:     yup.string().default(""),
})

const EMPTY_CAREER: CareerFormValues = {
  title:           "",
  slug:            "",
  department:      "",
  type:            "FULL_TIME",
  experienceLevel: "MID",
  location:        "",
  remote:          false,
  salaryEnabled:   false,
  salaryMin:       "",
  salaryMax:       "",
  currency:        "USD",
  description:     "",
  responsibilities: [],
  requirements:    [],
  benefits:        [],
  applyEmail:      "",
  closingDate:     "",
}

// ── Department modal ──────────────────────────────────────────────────────────

function DepartmentModal({
  department,
  onSave,
  onClose,
}: {
  department: Department | null
  onSave: (name: string) => Promise<void>
  onClose: () => void
}) {
  const [name, setName]     = useState(department?.name ?? "")
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#EBF3FC] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-[#0474C4] p-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-300">
              {department ? "Edit Department" : "New Department"}
            </div>
            <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-300 mt-0.5">
              {department ? "Update the department name." : "Add a new career department."}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/35 hover:text-white shrink-0 bg-[#EDF2FB]/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Research & Insights"
            className={inputCls}
            required
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
              {saving ? "Saving…" : department ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Career drawer ─────────────────────────────────────────────────────────────

function CareerDrawer({
  career,
  departments,
  onSave,
  onClose,
}: {
  career:      Career | null
  departments: Department[]
  onSave: (values: CareerFormValues) => Promise<void>
  onClose: () => void
}) {
  const [dateOpen, setDateOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CareerFormValues>({
    resolver: yupResolver(careerSchema) as Resolver<CareerFormValues>,
    defaultValues: career
      ? {
          title:           career.title,
          slug:            career.slug,
          department:      career.department,
          type:            career.type,
          experienceLevel: career.experienceLevel,
          location:        career.location,
          remote:          career.remote,
          salaryEnabled:   career.salaryMin !== null || career.salaryMax !== null,
          salaryMin:       career.salaryMin !== null ? String(career.salaryMin) : "",
          salaryMax:       career.salaryMax !== null ? String(career.salaryMax) : "",
          currency:        career.currency,
          description:     career.description,
          responsibilities: asArr(career.responsibilities),
          requirements:    asArr(career.requirements),
          benefits:        asArr(career.benefits),
          applyEmail:      career.applyEmail ?? "",
          closingDate:     career.closingDate ? career.closingDate.slice(0, 10) : "",
        }
      : EMPTY_CAREER,
  })

  const titleValue = watch("title")

  useEffect(() => {
    if (!career) setValue("slug", slugify(titleValue ?? ""), { shouldValidate: false })
  }, [titleValue, career, setValue])

  const onSubmit = async (data: CareerFormValues) => {
    await onSave(data)
  }

  return (
    <div className="fixed inset-0 z-120 flex items-start justify-end bg-black/40">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header — blue, matches workshop modal */}
        <div className="bg-[#0474C4] px-6 py-5 shrink-0 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider">
              {career ? "Edit Posting" : "New Posting"}
            </span>
          </div>
          <h2 className="text-[18px] font-extrabold text-white leading-tight">
            {career ? career.title : "Create Career Posting"}
          </h2>
          <p className="text-[12px] text-white/80 mt-1">
            {career ? "Update the posting details and click save." : "Add a new role to the careers page."}
          </p>
        </div>

        <form id="career-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          <Field label="Title" required>
            <input {...register("title")} autoFocus className={inputCls} placeholder="e.g. Senior Research Officer" />
            {errors.title && <p className="text-[11px] text-red-500 mt-0.5">{errors.title.message}</p>}
          </Field>

          <Field label="Slug" hint="Auto-generated from title">
            <input {...register("slug")} className={inputCls} placeholder="e.g. senior-research-officer" />
            {errors.slug && <p className="text-[11px] text-red-500 mt-0.5">{errors.slug.message}</p>}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Department" required>
              <select {...register("department")} className={inputCls}>
                <option value="">Select department…</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              {errors.department && <p className="text-[11px] text-red-500 mt-0.5">{errors.department.message}</p>}
            </Field>
            <Field label="Location" required>
              <input {...register("location")} className={inputCls} placeholder="e.g. Nairobi, Kenya" />
              {errors.location && <p className="text-[11px] text-red-500 mt-0.5">{errors.location.message}</p>}
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type" required>
              <select {...register("type")} className={inputCls}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Experience Level" required>
              <select {...register("experienceLevel")} className={inputCls}>
                {Object.entries(LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>

          <Controller
            name="remote"
            control={control}
            render={({ field }) => (
              <Toggle label="Remote-friendly" checked={field.value ?? false} onChange={field.onChange} />
            )}
          />

          <Controller
            name="salaryEnabled"
            control={control}
            render={({ field }) => (
              <Toggle label="Include salary range" checked={field.value ?? false} onChange={field.onChange} />
            )}
          />

          {watch("salaryEnabled") && (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Salary Min" required>
                <input type="number" min="0" step="100" {...register("salaryMin")} className={inputCls} placeholder="0" />
                {errors.salaryMin && <p className="text-[11px] text-red-500 mt-0.5">{errors.salaryMin.message}</p>}
              </Field>
              <Field label="Salary Max" required>
                <input type="number" min="0" step="100" {...register("salaryMax")} className={inputCls} placeholder="0" />
                {errors.salaryMax && <p className="text-[11px] text-red-500 mt-0.5">{errors.salaryMax.message}</p>}
              </Field>
              <Field label="Currency" required>
                <input {...register("currency")} className={inputCls} placeholder="USD" />
                {errors.currency && <p className="text-[11px] text-red-500 mt-0.5">{errors.currency.message}</p>}
              </Field>
            </div>
          )}

          <Field label="Description" required>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Detailed role description…"
                  minHeight={140}
                />
              )}
            />
            {errors.description && <p className="text-[11px] text-red-500 mt-0.5">{errors.description.message}</p>}
          </Field>

          <Field label="Responsibilities" hint="Add one per line">
            <Controller
              name="responsibilities"
              control={control}
              render={({ field }) => (
                <TagListInput value={field.value ?? []} onChange={field.onChange} placeholder="e.g. Lead programme design and delivery" />
              )}
            />
          </Field>

          <Field label="Requirements" hint="Add one per line">
            <Controller
              name="requirements"
              control={control}
              render={({ field }) => (
                <TagListInput value={field.value ?? []} onChange={field.onChange} placeholder="e.g. 5+ years in M&E" />
              )}
            />
          </Field>

          <Field label="Benefits" hint="Add one per line">
            <Controller
              name="benefits"
              control={control}
              render={({ field }) => (
                <TagListInput value={field.value ?? []} onChange={field.onChange} placeholder="e.g. Health insurance" />
              )}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Apply Email">
              <input type="email" {...register("applyEmail")} className={inputCls} placeholder="careers@arpsinstitute.org" />
            </Field>
            <Field label="Closing Date">
              <Controller
                name="closingDate"
                control={control}
                render={({ field }) => {
                  const selected = field.value ? new Date(field.value + "T00:00:00") : undefined
                  return (
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(inputCls, "flex items-center gap-2 text-left w-full", !field.value && "text-[#A8A39C]")}
                        >
                          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-[#A8A39C]" />
                          {selected ? format(selected, "dd MMM yyyy") : "Pick a date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selected}
                          onSelect={(date) => {
                            field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                            setDateOpen(false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )
                }}
              />
            </Field>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC] shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button form="career-form" type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
            {isSubmitting ? "Saving…" : career ? "Save Changes" : "Create Posting"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Filter dropdown ───────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  icon,
  active,
  options,
  value,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const activeLabel = options.find(o => o.value === value)?.label ?? ""

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${active ? "bg-[#0474C4] text-white border-[#0474C4]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"}`}
      >
        {icon}
        {label}
        {active && <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{activeLabel}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-44 max-h-72 overflow-y-auto">
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${value === o.value ? "bg-[#FEF3C7] text-[#0474C4]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"}`}
            >
              {o.label}
              {value === o.value && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCareersPage() {
  const [tab, setTab] = useState<Tab>("jobs")

  // Jobs
  const [careers, setCareers]         = useState<Career[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState("")
  const [departmentFilter, setDeptF]  = useState("All")
  const [experienceFilter, setExpF]   = useState("All")
  const [locationFilter, setLocF]     = useState("All")
  const [drawer, setDrawer]           = useState<"create" | Career | null>(null)
  const [toDelete, setToDelete]       = useState<Career | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const PAGE_SIZE                     = 20
  const [page, setPage]               = useState(1)

  // Departments
  const [departments, setDepartments]             = useState<Department[]>([])
  const [deptLoading, setDeptLoading]             = useState(true)
  const [deptSearch, setDeptSearch]               = useState("")
  const [deptPage, setDeptPage]                   = useState(1)
  const [deptModal, setDeptModal]                 = useState<"create" | Department | null>(null)
  const [deptToDelete, setDeptToDelete]           = useState<Department | null>(null)

  const fetchCareers = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/careers")
      const d = await r.json()
      if (r.ok) setCareers(d.careers ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDepartments = useCallback(async () => {
    setDeptLoading(true)
    try {
      const r = await fetch("/api/admin/careers/departments")
      const d = await r.json()
      if (r.ok) setDepartments(d.departments ?? [])
    } finally {
      setDeptLoading(false)
    }
  }, [])

  useEffect(() => { fetchCareers(); fetchDepartments() }, [fetchCareers, fetchDepartments])

  useEffect(() => { setPage(1) }, [search, departmentFilter, experienceFilter, locationFilter])

  // Derive location options from career data; departments come from the API state
  const locations = Array.from(new Set(careers.map(c => c.location).filter(Boolean))).sort()

  const filtered = careers.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      c.title.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    const matchDept = departmentFilter === "All" || c.department === departmentFilter
    const matchExp  = experienceFilter === "All" || c.experienceLevel === experienceFilter
    const matchLoc  = locationFilter   === "All" || c.location === locationFilter
    return matchSearch && matchDept && matchExp && matchLoc
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleSave(values: CareerFormValues) {
    const payload = {
      title:           values.title,
      slug:            values.slug || slugify(values.title),
      department:      values.department,
      type:            values.type,
      experienceLevel: values.experienceLevel,
      location:        values.location,
      remote:          values.remote,
      salaryMin:       values.salaryEnabled && values.salaryMin ? parseFloat(values.salaryMin) : null,
      salaryMax:       values.salaryEnabled && values.salaryMax ? parseFloat(values.salaryMax) : null,
      currency:        values.salaryEnabled ? (values.currency || "USD") : "USD",
      description:     values.description,
      responsibilities: values.responsibilities,
      requirements:    values.requirements,
      benefits:        values.benefits,
      applyEmail:      values.applyEmail || null,
      closingDate:     values.closingDate || null,
    }

    const isEdit = drawer !== "create" && drawer !== null
    const url    = isEdit ? `/api/admin/careers/${(drawer as Career).id}` : "/api/admin/careers"
    const method = isEdit ? "PUT" : "POST"

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error ?? "Something went wrong.")

    await fetchCareers()
    setDrawer(null)
  }

  async function handleToggleStatus(career: Career) {
    setTogglingIds(prev => new Set(prev).add(career.id))
    try {
      const r = await fetch(`/api/admin/careers/${career.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleStatus: true }),
      })
      if (r.ok) {
        const d = await r.json()
        setCareers(prev => prev.map(c => c.id === career.id ? d.career : c))
      }
    } finally {
      setTogglingIds(prev => { const n = new Set(prev); n.delete(career.id); return n })
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    const r = await fetch(`/api/admin/careers/${toDelete.id}`, { method: "DELETE" })
    if (r.status === 204 || r.ok) {
      setCareers(prev => prev.filter(c => c.id !== toDelete.id))
    } else {
      const d = await r.json()
      alert(d.error ?? "Failed to delete posting.")
    }
    setToDelete(null)
  }

  async function handleDeptSave(name: string) {
    const editing = deptModal !== "create" && deptModal !== null ? deptModal : null
    const url     = editing ? `/api/admin/careers/departments/${editing.id}` : "/api/admin/careers/departments"
    const method  = editing ? "PUT" : "POST"
    const r       = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
    const d       = await r.json()
    if (!r.ok) throw new Error(d.error ?? "Something went wrong.")
    await fetchDepartments()
    setDeptModal(null)
  }

  async function handleDeptDelete() {
    if (!deptToDelete) return
    const r = await fetch(`/api/admin/careers/departments/${deptToDelete.id}`, { method: "DELETE" })
    if (r.status === 204 || r.ok) {
      setDepartments(prev => prev.filter(d => d.id !== deptToDelete.id))
    } else {
      const d = await r.json()
      alert(d.error ?? "Failed to delete department.")
    }
    setDeptToDelete(null)
  }

  const filteredDepts   = departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase()))
  const deptTotalPages  = Math.max(1, Math.ceil(filteredDepts.length / PAGE_SIZE))
  const paginatedDepts  = filteredDepts.slice((deptPage - 1) * PAGE_SIZE, deptPage * PAGE_SIZE)

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Careers</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Manage open roles and departments</p>
        </div>
        <button
          onClick={() => tab === "jobs" ? setDrawer("create") : setDeptModal("create")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {tab === "jobs" ? "New Posting" : "New Department"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#F5F4F1] rounded-[12px] p-1 w-fit">
        {(["jobs", "departments"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-[9px] text-[13px] font-semibold capitalize transition-colors cursor-pointer ${tab === t ? "bg-white text-[#1A1916] shadow-sm" : "text-[#6B6560] hover:text-[#1A1916]"}`}
          >
            {t}
            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t ? "bg-[#F5F4F1] text-[#6B6560]" : "bg-[#E5E2DC] text-[#A8A39C]"}`}>
              {t === "jobs" ? careers.length : departments.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── JOBS TAB ──────────────────────────────────────────────────────────── */}
      {tab === "jobs" && (
        <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search postings…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <FilterDropdown
                label="Department"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>}
                active={departmentFilter !== "All"}
                value={departmentFilter}
                onChange={setDeptF}
                options={[{ value: "All", label: "All" }, ...departments.map(d => ({ value: d.name, label: d.name }))]}
              />
              <FilterDropdown
                label="Experience"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>}
                active={experienceFilter !== "All"}
                value={experienceFilter}
                onChange={setExpF}
                options={[{ value: "All", label: "All" }, ...Object.entries(LEVEL_LABELS).map(([k, v]) => ({ value: k, label: v }))]}
              />
              <FilterDropdown
                label="Location"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>}
                active={locationFilter !== "All"}
                value={locationFilter}
                onChange={setLocF}
                options={[{ value: "All", label: "All" }, ...locations.map(l => ({ value: l, label: l }))]}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                  {["Posting", "Department", "Type", "Level", "Location", "Status", ""].map((col, i) => (
                    <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">No career postings found.</td></tr>
                ) : paginated.map(career => (
                  <tr key={career.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1A1916] leading-tight line-clamp-1">{career.title}</p>
                      <p className="text-[11px] text-[#A8A39C] mt-0.5">{career.applications} application{career.applications === 1 ? "" : "s"} · {career.views} views</p>
                    </td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{career.department}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                        {TYPE_LABELS[career.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700">
                        {LEVEL_LABELS[career.experienceLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">
                      {career.location}{career.remote && <span className="ml-1 text-[10px] text-[#0474C4] font-semibold">· Remote</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${career.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${career.status === "PUBLISHED" ? "bg-emerald-500" : "bg-amber-400"}`} />
                        {career.status === "PUBLISHED" ? "Published" : "Archived"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setDrawer(career)} title="Edit" className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleToggleStatus(career)} disabled={togglingIds.has(career.id)} title={career.status === "PUBLISHED" ? "Archive" : "Publish"} className={`w-7 h-7 flex items-center justify-center rounded-[8px] border transition-colors cursor-pointer disabled:opacity-50 ${career.status === "PUBLISHED" ? "border-amber-200 bg-amber-50 text-amber-600 hover:border-amber-300" : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300"}`}>
                          {career.status === "PUBLISHED" ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                          )}
                        </button>
                        <Link href={`/administrator/careers/${career.id}`} title="View analytics" className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </Link>
                        <button onClick={() => setToDelete(career)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
            <p className="text-[11px] text-[#A8A39C]">
              {filtered.length === 0 ? (
                <>Showing <span className="font-semibold text-[#6B6560]">0</span> of <span className="font-semibold text-[#6B6560]">{careers.length}</span> {careers.length === 1 ? "posting" : "postings"}</>
              ) : (
                <>Showing <span className="font-semibold text-[#6B6560]">{(page - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#6B6560]">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-[#6B6560]">{filtered.length}</span> {filtered.length === 1 ? "posting" : "postings"}</>
              )}
            </p>
            {filtered.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Prev</button>
                <span className="text-[11px] font-semibold text-[#6B6560] px-2">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DEPARTMENTS TAB ───────────────────────────────────────────────────── */}
      {tab === "departments" && (
        <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={deptSearch} onChange={e => { setDeptSearch(e.target.value); setDeptPage(1) }} placeholder="Search departments…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                  {["Department", "Created", ""].map((col, i) => (
                    <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deptLoading ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">Loading…</td></tr>
                ) : filteredDepts.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">No departments found. Create one to get started.</td></tr>
                ) : paginatedDepts.map(dept => (
                  <tr key={dept.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#1A1916]">{dept.name}</td>
                    <td className="px-4 py-3 text-[#A8A39C] text-[12px]">
                      {new Date(dept.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setDeptModal(dept)} title="Edit" className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeptToDelete(dept)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
            <p className="text-[11px] text-[#A8A39C]">
              <span className="font-semibold text-[#6B6560]">{filteredDepts.length}</span> {filteredDepts.length === 1 ? "department" : "departments"}
            </p>
            {filteredDepts.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setDeptPage(p => Math.max(1, p - 1))} disabled={deptPage === 1} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Prev</button>
                <span className="text-[11px] font-semibold text-[#6B6560] px-2">{deptPage} / {deptTotalPages}</span>
                <button onClick={() => setDeptPage(p => Math.min(deptTotalPages, p + 1))} disabled={deptPage >= deptTotalPages} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer & dialogs */}
      {drawer !== null && (
        <CareerDrawer
          career={drawer === "create" ? null : drawer}
          departments={departments}
          onSave={handleSave}
          onClose={() => setDrawer(null)}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Delete "${toDelete.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      {deptModal !== null && (
        <DepartmentModal
          department={deptModal === "create" ? null : deptModal}
          onSave={handleDeptSave}
          onClose={() => setDeptModal(null)}
        />
      )}

      {deptToDelete && (
        <ConfirmDialog
          message={`Delete "${deptToDelete.name}"? This cannot be undone.`}
          onConfirm={handleDeptDelete}
          onCancel={() => setDeptToDelete(null)}
        />
      )}
    </div>
  )
}
