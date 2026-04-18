"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { useForm, useWatch, Controller, type Resolver } from "react-hook-form"
import RichTextEditor from "@/components/ui/RichTextEditor"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { format } from "date-fns"
import { CalendarIcon, Clock, Globe } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// ── Timezone list (built from Intl API — evaluated once at module load) ────────
const TIMEZONES: string[] = (Intl as unknown as { supportedValuesOf(key: string): string[] })
  .supportedValuesOf("timeZone")

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkshopType     = "FREE" | "PAID"
type WorkshopCategory = "SHORT_COURSE" | "WEBINAR" | "MASTERCLASS" | "CONFERENCE" | "WORKSHOP"

type Workshop = {
  id:             string
  title:          string
  slug:           string
  description:    string
  type:           WorkshopType
  category:       WorkshopCategory
  fee:            number
  featured:       boolean
  published:      boolean
  date:           string | null
  startTime:      string
  endTime:        string
  timezone:       string
  duration:       number
  level:          string
  facilitator:    string
  facilitators:   unknown | null
  medium:         string
  onlinePlatform: string | null
  onlineLink:     string | null
  venueAddress:   string | null
  venueCity:      string | null
  venueState:     string | null
  venueCountry:   string | null
  capacity:       number
  registered:     number
  coverImage:     string | null
  createdAt:      string
  updatedAt:      string
  _count?:        { registrations: number }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<WorkshopType, string> = {
  FREE: "Free",
  PAID: "Paid",
}

const CATEGORY_LABELS: Record<WorkshopCategory, string> = {
  SHORT_COURSE: "Short Course",
  WEBINAR:      "Webinar",
  MASTERCLASS:  "Masterclass",
  CONFERENCE:   "Conference",
  WORKSHOP:     "Workshop",
}

const TYPE_COLORS: Record<WorkshopType, string> = {
  FREE: "bg-emerald-50 text-emerald-700",
  PAID: "bg-amber-50 text-amber-700",
}

const CATEGORY_COLORS: Record<WorkshopCategory, string> = {
  SHORT_COURSE: "bg-teal-50 text-teal-700",
  WEBINAR:      "bg-purple-50 text-purple-700",
  MASTERCLASS:  "bg-amber-50 text-amber-700",
  CONFERENCE:   "bg-rose-50 text-rose-700",
  WORKSHOP:     "bg-blue-50 text-blue-700",
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

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtFee(fee: number) {
  return fee === 0 ? "Free" : `$${fee.toLocaleString()}`
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

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

// ── Status badge (clickable) ──────────────────────────────────────────────────

function StatusBadge({ published, onClick, loading }: { published: boolean; onClick?: () => void; loading?: boolean }) {
  const base  = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-opacity"
  const color = published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
  const dot   = published ? "bg-emerald-500" : "bg-amber-400"

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        title={published ? "Click to set as Draft" : "Click to Publish"}
        className={`${base} ${color} cursor-pointer hover:opacity-70 disabled:opacity-40`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {loading ? "Saving…" : published ? "Published" : "Draft"}
      </button>
    )
  }

  return (
    <span className={`${base} ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {published ? "Published" : "Draft"}
    </span>
  )
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <p className="text-[14px] text-[#1A1916] mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer">Delete</button>
        </div>
      </div>
    </div>
  )
}


// ── Workshop form values & validation ─────────────────────────────────────────

type WorkshopFormValues = {
  title:          string
  slug:           string
  description:    string
  type:           WorkshopType
  category:       WorkshopCategory
  fee:            string
  featured:       boolean
  published:      boolean
  date:           string   // yyyy-MM-dd
  startTime:      string   // HH:mm
  endTime:        string   // HH:mm
  timezone:       string   // IANA timezone
  duration:       string   // stored as number string
  level:          "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  capacity:       string
  medium:         "ONLINE" | "IN_PERSON"
  onlinePlatform: string
  onlineLink:     string
  venueAddress:   string
  venueCity:      string
  venueState:     string
  venueCountry:   string
}

const workshopFormSchema = yup.object({
  title:       yup.string().trim().min(2, "At least 2 characters").max(255).required("Title is required"),
  slug:        yup.string().trim().min(2).max(255)
                  .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase, numbers and hyphens only")
                  .required("Slug is required"),
  description: yup.string().trim().min(10, "At least 10 characters").required("Description is required"),
  type:        yup.string().oneOf(["FREE", "PAID"] as const).required("Type is required"),
  category:    yup.string().oneOf(["SHORT_COURSE", "WEBINAR", "MASTERCLASS", "CONFERENCE", "WORKSHOP"] as const).required("Category is required"),
  fee:         yup.string().required("Fee is required"),
  duration:    yup.string()
                  .required("Duration is required")
                  .matches(/^[1-9][0-9]*$/, "Must be a positive whole number"),
  level:       yup.string().oneOf(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).required("Level is required"),
  date:        yup.string()
                  .required("Date is required")
                  .test("not-past", "Date cannot be in the past", value => {
                    if (!value) return true
                    const today = new Date(); today.setHours(0, 0, 0, 0)
                    return new Date(value + "T00:00:00") >= today
                  }),
  startTime:   yup.string().required("Start time is required"),
  endTime:     yup.string().required("End time is required"),
  timezone:    yup.string().required("Timezone is required"),
  capacity:    yup.string().required("Capacity is required"),
  featured:    yup.boolean().required().default(false),
  published:   yup.boolean().required().default(false),
  medium:         yup.string().oneOf(["ONLINE", "IN_PERSON"] as const).required().default("ONLINE"),
  onlinePlatform: yup.string().when("medium", (medium: string[], schema) =>
    medium[0] === "ONLINE" ? schema.required("Platform is required") : schema.optional()
  ).default(""),
  onlineLink:  yup.string().when("medium", (medium: string[], schema) =>
    medium[0] === "ONLINE" ? schema.required("Meeting link is required") : schema.optional()
  ).default(""),
  venueAddress: yup.string().default(""),
  venueCity:    yup.string().default(""),
  venueState:   yup.string().default(""),
  venueCountry: yup.string().when("medium", (medium: string[], schema) =>
    medium[0] === "IN_PERSON" ? schema.required("Country is required") : schema.optional()
  ).default(""),
})

const EMPTY_FORM: WorkshopFormValues = {
  title:          "",
  slug:           "",
  description:    "",
  type:           "FREE",
  category:       "WORKSHOP",
  fee:            "0",
  featured:       false,
  published:      false,
  date:           "",
  startTime:      "",
  endTime:        "",
  timezone:       "UTC",
  duration:       "2",
  level:          "BEGINNER",
  capacity:       "100",
  medium:         "ONLINE",
  onlinePlatform: "",
  onlineLink:     "",
  venueAddress:   "",
  venueCity:      "",
  venueState:     "",
  venueCountry:   "",
}

// ── Timezone searchable select ────────────────────────────────────────────────

function TimezoneSelect({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState("")
  const ref                 = useRef<HTMLDivElement>(null)

  const filtered = search
    ? TIMEZONES.filter(tz => tz.toLowerCase().includes(search.toLowerCase()))
    : TIMEZONES

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch("") }}
        className={cn(inputCls, "flex items-center justify-between text-left w-full gap-2", !value && "text-[#A8A39C]")}
      >
        <span className="flex items-center gap-1.5 truncate">
          <Globe className="h-3.5 w-3.5 shrink-0 text-[#A8A39C]" />
          <span className="truncate">{value || "Select timezone…"}</span>
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="absolute z-30 left-0 right-0 top-[calc(100%+4px)] bg-white border border-[#E5E2DC] rounded-xl shadow-lg overflow-hidden">
          <div className="px-2 py-1.5 border-b border-[#E5E2DC]">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search timezones…"
              className={inputCls}
            />
          </div>
          <ul className="overflow-y-auto max-h-52">
            {filtered.length === 0 ? (
              <li className="px-3.5 py-2 text-[12px] text-[#A8A39C]">No results</li>
            ) : filtered.map(tz => (
              <li key={tz}>
                <button
                  type="button"
                  onClick={() => { onChange(tz); setOpen(false) }}
                  className={`w-full text-left px-3.5 py-2 text-[13px] transition-colors cursor-pointer border-none ${value === tz ? "bg-[#EBF5FF] text-[#0474C4] font-semibold" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"}`}
                >
                  {tz}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

// ── Workshop modal ────────────────────────────────────────────────────────────

function WorkshopModal({
  workshop,
  onSave,
  onClose,
}: {
  workshop: Workshop | null
  onSave: (values: WorkshopFormValues) => Promise<void>
  onClose: () => void
}) {
  const [dateOpen, setDateOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkshopFormValues>({
    resolver: yupResolver(workshopFormSchema) as Resolver<WorkshopFormValues>,
    defaultValues: workshop
      ? {
          title:          workshop.title,
          slug:           workshop.slug,
          description:    workshop.description,
          type:           workshop.type,
          category:       workshop.category,
          fee:            String(workshop.fee),
          featured:       workshop.featured,
          published:      workshop.published,
          date:           workshop.date ? workshop.date.slice(0, 10) : "",
          startTime:      workshop.startTime ?? "",
          endTime:        workshop.endTime   ?? "",
          timezone:       workshop.timezone  ?? "UTC",
          duration:       String(workshop.duration ?? 2),
          level:          (workshop.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED") ?? "BEGINNER",
          capacity:       String(workshop.capacity),
          medium:         (workshop.medium as "ONLINE" | "IN_PERSON") ?? "ONLINE",
          onlinePlatform: workshop.onlinePlatform ?? "",
          onlineLink:     workshop.onlineLink     ?? "",
          venueAddress:   workshop.venueAddress   ?? "",
          venueCity:      workshop.venueCity       ?? "",
          venueState:     workshop.venueState      ?? "",
          venueCountry:   workshop.venueCountry    ?? "",
        }
      : EMPTY_FORM,
  })

  // Auto-generate slug from title for new workshops only
  const titleValue = useWatch({ control, name: "title" })

  // Watch medium for conditional delivery-mode fields
  const watchedMedium = useWatch({ control, name: "medium" })

  useEffect(() => {
    if (!workshop) {
      setValue("slug", slugify(titleValue ?? ""), { shouldValidate: false })
    }
  }, [titleValue, workshop, setValue])

  const onSubmit = async (data: WorkshopFormValues) => {
    await onSave(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#FDF3E0] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0474C4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1A1916] leading-tight">{workshop ? "Edit Workshop" : "New Workshop"}</h2>
              <p className="text-[12px] text-[#A8A39C] mt-0.5">{workshop ? "Update workshop details." : "Create a new workshop, webinar, or masterclass."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F4F1] text-[#A8A39C] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <form id="workshop-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Title */}
          <Field label="Title" required>
            <input {...register("title")} autoFocus className={inputCls} placeholder="e.g. Advanced Research Methods Masterclass" />
            {errors.title && <p className="text-[11px] text-red-500 mt-0.5">{errors.title.message}</p>}
          </Field>

          {/* Slug */}
          <Field label="Slug" hint="Auto-generated from title">
            <input {...register("slug")} className={inputCls} placeholder="e.g. advanced-research-methods-masterclass" />
            {errors.slug && <p className="text-[11px] text-red-500 mt-0.5">{errors.slug.message}</p>}
          </Field>

          {/* Type + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type" required>
              <select {...register("type")} className={inputCls}>
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
              </select>
              {errors.type && <p className="text-[11px] text-red-500 mt-0.5">{errors.type.message}</p>}
            </Field>
            <Field label="Category" required>
              <select {...register("category")} className={inputCls}>
                <option value="SHORT_COURSE">Short Course</option>
                <option value="WEBINAR">Webinar</option>
                <option value="MASTERCLASS">Masterclass</option>
                <option value="CONFERENCE">Conference</option>
                <option value="WORKSHOP">Workshop</option>
              </select>
              {errors.category && <p className="text-[11px] text-red-500 mt-0.5">{errors.category.message}</p>}
            </Field>
          </div>

          {/* Description — rich text */}
          <Field label="Description" required>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="A detailed description of the workshop…"
                  minHeight={160}
                />
              )}
            />
            {errors.description && <p className="text-[11px] text-red-500 mt-0.5">{errors.description.message}</p>}
          </Field>

          {/* Level + Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Level" required>
              <select {...register("level")} className={inputCls}>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
              {errors.level && <p className="text-[11px] text-red-500 mt-0.5">{errors.level.message}</p>}
            </Field>
            <Field label="Duration (hours)" required>
              <input type="number" min="1" step="1" {...register("duration")} className={inputCls} placeholder="e.g. 3" />
              {errors.duration && <p className="text-[11px] text-red-500 mt-0.5">{errors.duration.message}</p>}
            </Field>
          </div>

          {/* Date + Start Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Date" required>
              <Controller
                name="date"
                control={control}
                render={({ field }) => {
                  const selected = field.value ? new Date(field.value + "T00:00:00") : undefined
                  return (
                    <>
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
                            disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                            onSelect={(date) => {
                              field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                              setDateOpen(false)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.date && <p className="text-[11px] text-red-500 mt-0.5">{errors.date.message}</p>}
                    </>
                  )
                }}
              />
            </Field>
            <Field label="Start Time" required>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A8A39C] pointer-events-none" />
                <input type="time" {...register("startTime")} className={cn(inputCls, "pl-8")} />
              </div>
              {errors.startTime && <p className="text-[11px] text-red-500 mt-0.5">{errors.startTime.message}</p>}
            </Field>
          </div>

          {/* End Time + Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="End Time" required>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A8A39C] pointer-events-none" />
                <input type="time" {...register("endTime")} className={cn(inputCls, "pl-8")} />
              </div>
              {errors.endTime && <p className="text-[11px] text-red-500 mt-0.5">{errors.endTime.message}</p>}
            </Field>
            <Field label="Timezone" required>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <TimezoneSelect
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.timezone?.message}
                  />
                )}
              />
            </Field>
          </div>

          {/* Fee + Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Fee" hint="0 = Free" required>
              <input type="number" min="0" step="0.01" {...register("fee")} className={inputCls} placeholder="0" />
              {errors.fee && <p className="text-[11px] text-red-500 mt-0.5">{errors.fee.message}</p>}
            </Field>
            <Field label="Capacity" required>
              <input type="number" min="1" {...register("capacity")} className={inputCls} placeholder="100" />
              {errors.capacity && <p className="text-[11px] text-red-500 mt-0.5">{errors.capacity.message}</p>}
            </Field>
          </div>

          {/* Delivery Mode */}
          <Field label="Delivery Mode" required>
            <div className="flex items-center gap-2">
              <Controller
                name="medium"
                control={control}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => field.onChange("ONLINE")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold border transition-colors cursor-pointer ${field.value === "ONLINE" ? "bg-[#0474C4] text-white border-[#0474C4]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4]"}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                      </svg>
                      Online
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("IN_PERSON")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold border transition-colors cursor-pointer ${field.value === "IN_PERSON" ? "bg-[#0474C4] text-white border-[#0474C4]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4]"}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      In-Person
                    </button>
                  </>
                )}
              />
            </div>
          </Field>

          {watchedMedium === "ONLINE" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Platform" required>
                  <select {...register("onlinePlatform")} className={inputCls}>
                    <option value="">— Select platform —</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Webex">Webex</option>
                    <option value="Hopin">Hopin</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.onlinePlatform && <p className="text-[11px] text-red-500 mt-0.5">{errors.onlinePlatform.message}</p>}
                </Field>
              </div>
              <Field label="Meeting Link" required>
                <input {...register("onlineLink")} className={inputCls} placeholder="e.g. https://zoom.us/j/..." />
                {errors.onlineLink && <p className="text-[11px] text-red-500 mt-0.5">{errors.onlineLink.message}</p>}
              </Field>
            </>
          )}

          {watchedMedium === "IN_PERSON" && (
            <>
              <Field label="Address">
                <input {...register("venueAddress")} className={inputCls} placeholder="e.g. 15 Main Street" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="City / County">
                  <input {...register("venueCity")} className={inputCls} placeholder="e.g. Nairobi" />
                </Field>
                <Field label="State / Province">
                  <input {...register("venueState")} className={inputCls} placeholder="e.g. Nairobi County" />
                </Field>
              </div>
              <Field label="Country" required>
                <input {...register("venueCountry")} className={inputCls} placeholder="e.g. Kenya" />
                {errors.venueCountry && <p className="text-[11px] text-red-500 mt-0.5">{errors.venueCountry.message}</p>}
              </Field>
            </>
          )}

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <Controller
              name="featured"
              control={control}
              render={({ field }) => (
                <Toggle label="Featured" checked={field.value ?? false} onChange={field.onChange} />
              )}
            />
            <Controller
              name="published"
              control={control}
              render={({ field }) => (
                <Toggle label="Published" checked={field.value ?? false} onChange={field.onChange} />
              )}
            />
          </div>
        </form>

        {/* Footer — button submits the form via id */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC] shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button form="workshop-form" type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
            {isSubmitting ? "Saving…" : workshop ? "Save Changes" : "Create Workshop"}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminWorkshopsPage() {
  const router = useRouter()
  const [workshops, setWorkshops]           = useState<Workshop[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState("")
  const [typeFilter, setTypeFilter]         = useState<WorkshopType | "ALL">("ALL")
  const [modal, setModal]                   = useState<"create" | Workshop | null>(null)
  const [deleteTarget, setDeleteTarget]     = useState<Workshop | null>(null)
  const [togglingIds, setTogglingIds]       = useState<Set<string>>(new Set())
  const [filterOpen, setFilterOpen]         = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>("All")
  const filterRef                           = useRef<HTMLDivElement>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchWorkshops = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/workshops")
      const d = await r.json()
      if (r.ok) setWorkshops(d.workshops ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWorkshops() }, [fetchWorkshops])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = workshops.filter(w => {
    const matchSearch   = !search || w.title.toLowerCase().includes(search.toLowerCase()) || w.facilitator.toLowerCase().includes(search.toLowerCase())
    const matchType     = typeFilter === "ALL" || w.type === typeFilter
    const matchCategory = categoryFilter === "All" || CATEGORY_LABELS[w.category] === categoryFilter
    return matchSearch && matchType && matchCategory
  })

  // ── Inline toggle ──────────────────────────────────────────────────────────

  async function handleTogglePublished(workshop: Workshop) {
    setTogglingIds(prev => new Set(prev).add(workshop.id))
    try {
      const r = await fetch(`/api/workshops/${workshop.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !workshop.published }),
      })
      if (r.ok) {
        setWorkshops(prev => prev.map(w => w.id === workshop.id ? { ...w, published: !w.published } : w))
      }
    } finally {
      setTogglingIds(prev => { const n = new Set(prev); n.delete(workshop.id); return n })
    }
  }

  // ── Save (create / update) ─────────────────────────────────────────────────

  async function handleSave(values: WorkshopFormValues) {
    const payload = {
      title:          values.title,
      slug:           values.slug || slugify(values.title),
      description:    values.description,
      type:           values.type,
      category:       values.category,
      fee:            parseFloat(values.fee) || 0,
      featured:       values.featured,
      published:      values.published,
      date:           values.date || null,
      startTime:      values.startTime,
      endTime:        values.endTime,
      timezone:       values.timezone,
      duration:       parseInt(values.duration, 10) || 2,
      level:          values.level,
      capacity:       parseInt(values.capacity, 10) || 100,
      medium:         values.medium,
      onlinePlatform: values.medium === "ONLINE"    ? (values.onlinePlatform || null) : null,
      onlineLink:     values.medium === "ONLINE"    ? (values.onlineLink     || null) : null,
      venueAddress:   values.medium === "IN_PERSON" ? (values.venueAddress   || null) : null,
      venueCity:      values.medium === "IN_PERSON" ? (values.venueCity      || null) : null,
      venueState:     values.medium === "IN_PERSON" ? (values.venueState     || null) : null,
      venueCountry:   values.medium === "IN_PERSON" ? (values.venueCountry   || null) : null,
    }

    const isEdit    = modal !== "create" && modal !== null
    const url       = isEdit ? `/api/workshops/${(modal as Workshop).id}` : "/api/workshops"
    const method    = isEdit ? "PUT" : "POST"

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error ?? "Something went wrong.")

    await fetchWorkshops()
    setModal(null)
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    const r = await fetch(`/api/workshops/${deleteTarget.id}`, { method: "DELETE" })
    if (r.status === 204 || r.ok) {
      setWorkshops(prev => prev.filter(w => w.id !== deleteTarget.id))
    } else {
      const d = await r.json()
      alert(d.error ?? "Failed to delete workshop.")
    }
    setDeleteTarget(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const counts = {
    all:  workshops.length,
    free: workshops.filter(w => w.type === "FREE").length,
    paid: workshops.filter(w => w.type === "PAID").length,
  }

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Workshops</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Manage workshops, webinars and masterclasses</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Workshop
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-1 mb-5 bg-[#F5F4F1] rounded-[12px] p-1 w-fit">
        {([["ALL", "All", counts.all], ["FREE", "Free", counts.free], ["PAID", "Paid", counts.paid]] as const).map(([val, label, count]) => (
          <button
            key={val}
            onClick={() => setTypeFilter(val as WorkshopType | "ALL")}
            className={`px-4 py-1.5 rounded-[9px] text-[13px] font-semibold transition-colors cursor-pointer ${typeFilter === val ? "bg-white text-[#1A1916] shadow-sm" : "text-[#6B6560] hover:text-[#1A1916]"}`}
          >
            {label}
            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeFilter === val ? "bg-[#F5F4F1] text-[#6B6560]" : "bg-[#E5E2DC] text-[#A8A39C]"}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workshops…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setFilterOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${categoryFilter !== "All" ? "bg-[#0474C4] text-white border-[#0474C4]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filter
                {categoryFilter !== "All" && <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{categoryFilter}</span>}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-36">
                  {["All", "Short Course", "Webinar", "Masterclass", "Conference", "Workshop"].map(f => (
                    <button key={f} onClick={() => { setCategoryFilter(f); setFilterOpen(false) }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${categoryFilter === f ? "bg-[#FEF3C7] text-[#0474C4]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"}`}
                    >
                      {f}
                      {categoryFilter === f && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                  {["Workshop", "Type", "Category", "Fee", "Date", "Status", ""].map((col, i) => (
                    <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">No workshops found.</td></tr>
                ) : filtered.map(workshop => (
                  <tr key={workshop.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                    {/* Workshop info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {workshop.coverImage ? (
                          <div className="relative w-9 h-9 rounded-[8px] overflow-hidden shrink-0 border border-[#E5E2DC]">
                            <Image src={workshop.coverImage} alt={workshop.title} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-[8px] bg-[#F5F4F1] flex items-center justify-center shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A39C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#1A1916] leading-tight line-clamp-1">{workshop.title}</p>
                          {workshop.facilitator && (
                            <p className="text-[11px] text-[#A8A39C] mt-0.5">{workshop.facilitator}</p>
                          )}
                          {workshop.featured && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#0474C4] mt-0.5">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${TYPE_COLORS[workshop.type]}`}>
                        {TYPE_LABELS[workshop.type]}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORY_COLORS[workshop.category]}`}>
                        {CATEGORY_LABELS[workshop.category]}
                      </span>
                    </td>

                    {/* Fee */}
                    <td className="px-4 py-3">
                      <span className={`text-[12px] font-semibold ${workshop.fee === 0 ? "text-emerald-600" : "text-[#1A1916]"}`}>
                        {fmtFee(workshop.fee)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-[#6B6560]">
                      {fmtDate(workshop.date)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge
                        published={workshop.published}
                        loading={togglingIds.has(workshop.id)}
                        onClick={() => handleTogglePublished(workshop)}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => router.push(`/administrator/workshops/${workshop.id}`)}
                          title="View"
                          className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setModal(workshop)}
                          title="Edit"
                          className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(workshop)}
                          title="Delete"
                          className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
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
              Showing <span className="font-semibold text-[#6B6560]">{filtered.length}</span> of{" "}
              <span className="font-semibold text-[#6B6560]">{workshops.length}</span>{" "}
              {workshops.length === 1 ? "entry" : "entries"}
            </p>
            {filtered.length < workshops.length && (
              <p className="text-[11px] text-[#0474C4] font-semibold">{workshops.length - filtered.length} filtered out</p>
            )}
          </div>
        </div>

      {/* Modals */}
      {modal !== null && (
        <WorkshopModal
          workshop={modal === "create" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
