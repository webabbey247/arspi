"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form"
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ── Types ─────────────────────────────────────────────────────────────────────

type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

type Category = {
  id:        string
  name:      string
  slug:      string
  createdAt: string
  _count:    { courses: number }
}

type Program = {
  id:          string
  title:       string
  slug:        string
  description: string
  thumbnail:   string | null
  price:       number
  level:       CourseLevel
  featured:    boolean
  published:   boolean
  instructorId: string
  instructor:  { id: string; email: string; profile: { firstName: string | null; lastName: string | null } | null }
  categoryId:  string | null
  category:    Category | null
  createdAt:   string
  updatedAt:   string
  _count:      { enrollments: number }

  tagline:              string | null
  duration:             string | null
  format:               string | null
  startDate:            string | null
  endDate:              string | null
  cohortSize:           number | null
  rating:               number | null
  reviewCount:          number | null
  enrolledCount:        number | null
  countriesCount:       number | null
  overview:             string | null
  targetAudience:       unknown | null
  learningObjectives:   unknown | null
  curriculum:           unknown | null
  whatIsIncluded:       unknown | null
  faqs:                 unknown | null
  instructorName:       string | null
  instructorTitle:      string | null
  instructorBio:        string | null
  instructorInitials:   string | null
  instructorCredentials: unknown | null
}

type Tab = "programs" | "categories"

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER:     "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED:     "Advanced",
}

const LEVEL_COLORS: Record<CourseLevel, string> = {
  BEGINNER:     "bg-emerald-50 text-emerald-700",
  INTERMEDIATE: "bg-amber-50 text-amber-700",
  ADVANCED:     "bg-rose-50 text-rose-700",
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtPrice(price: number) {
  return price === 0 ? "Free" : `$${price.toLocaleString()}`
}

function instructorName(p: Program) {
  const prof = p.instructor.profile
  if (prof?.firstName || prof?.lastName) {
    return [prof.firstName, prof.lastName].filter(Boolean).join(" ")
  }
  return p.instructor.email
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

// ── Thumbnail upload ───────────────────────────────────────────────────────────

function ThumbnailUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const { startUpload } = useUploadThing("imageUploader")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await startUpload([file])
      if (res?.[0]?.url) onChange(res[0].url)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div className="relative w-full h-32 rounded-[10px] overflow-hidden border border-[#E5E2DC]">
          <Image src={value} alt="Thumbnail" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] text-[13px] font-semibold border border-dashed border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 transition-colors cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {uploading ? "Uploading…" : value ? "Replace thumbnail" : "Upload thumbnail"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Program modal (multi-step) ────────────────────────────────────────────────

type Lesson = {
  title:         string
  description:   string
  embedUrls:     string[]
  referenceUrls: string[]
}
type CurriculumItem = {
  week:           string
  title:          string
  desc:           string
  isAssessment:   boolean
  assessmentLink: string
  lessons:        Lesson[]
}
type FaqItem = { q: string; a: string }

type ProgramFormValues = {
  // Step 1 — Basic Info
  title:      string
  slug:       string
  thumbnail:  string
  price:      string
  level:      CourseLevel
  categoryId: string
  tagline:    string
  featured:   boolean
  published:  boolean

  // Step 2 — Programme Info
  description:    string
  duration:       string
  format:         string
  startDate:      string
  endDate:        string
  cohortSize:     string
  rating:         string
  reviewCount:    string
  enrolledCount:  string
  countriesCount: string

  // Step 3 — Objectives
  overview:           string
  targetAudience:     string[]
  learningObjectives: string[]
  whatIsIncluded:     string[]

  // Step 4 — Curriculum
  curriculum: CurriculumItem[]

  // Step 5 — Facilitator
  instructorName:        string
  instructorTitle:       string
  instructorBio:         string
  instructorCredentials: string[]

  // Step 6 — FAQs
  faqs: FaqItem[]
}

const EMPTY_FORM: ProgramFormValues = {
  title: "", slug: "", thumbnail: "", price: "0", level: "BEGINNER",
  categoryId: "", tagline: "", featured: false, published: false,
  description: "", duration: "", format: "", startDate: "", endDate: "", cohortSize: "",
  rating: "", reviewCount: "", enrolledCount: "", countriesCount: "",
  overview: "", targetAudience: [], learningObjectives: [], whatIsIncluded: [],
  instructorName: "", instructorTitle: "",
  instructorBio: "", instructorCredentials: [],
  curriculum: [], faqs: [],
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { label: "Basic Info",  desc: "Title, category & pricing"    },
  { label: "Programme",   desc: "Description & schedule"       },
  { label: "Objectives",  desc: "Outcomes & target audience"   },
  { label: "Curriculum",  desc: "Weekly programme outline"     },
  { label: "Facilitator", desc: "Instructor details"           },
  { label: "FAQs",        desc: "Frequently asked questions"   },
]

// ── Validation schema ─────────────────────────────────────────────────────────

const programSchema = yup.object({
  // Step 1
  title:      yup.string().min(3, "Title must be at least 3 characters").max(255, "Title is too long").required("Title is required"),
  slug:       yup.string()
    .test("slug-format", "Slug must be lowercase with hyphens only", v => !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v))
    .max(255, "Slug is too long"),
  thumbnail:  yup.string(),
  price:      yup.string(),
  level:      yup.string().oneOf(["BEGINNER", "INTERMEDIATE", "ADVANCED"], "Invalid level").required("Level is required"),
  categoryId: yup.string(),
  tagline:    yup.string().max(500, "Tagline is too long"),
  featured:   yup.boolean().required(),
  published:  yup.boolean().required(),

  // Step 2
  description:    yup.string().min(10, "Description must be at least 10 characters").required("Description is required"),
  duration:       yup.string(),
  format:         yup.string(),
  startDate:      yup.string(),
  endDate:        yup.string(),
  cohortSize:     yup.string(),
  rating:         yup.string().test("rating-range", "Rating must be between 0 and 5", v => !v || (parseFloat(v) >= 0 && parseFloat(v) <= 5)),
  reviewCount:    yup.string(),
  enrolledCount:  yup.string(),
  countriesCount: yup.string(),

  // Step 3
  overview:           yup.string(),
  targetAudience:     yup.array(yup.string().default("")),
  learningObjectives: yup.array(yup.string().default("")),
  whatIsIncluded:     yup.array(yup.string().default("")),

  // Step 4 — Curriculum
  curriculum: yup.array(yup.object({
    week:           yup.string(),
    title:          yup.string().required("Module title is required"),
    desc:           yup.string(),
    isAssessment:   yup.boolean(),
    assessmentLink: yup.string(),
    lessons: yup.array(yup.object({
      title:         yup.string().required("Lesson title is required"),
      description:   yup.string(),
      embedUrls:     yup.array(yup.string().default("")),
      referenceUrls: yup.array(yup.string().default("")),
    })),
  })),

  // Step 5 — Facilitator
  instructorName:        yup.string(),
  instructorTitle:       yup.string(),
  instructorBio:         yup.string(),
  instructorCredentials: yup.array(yup.string().default("")),

  // Step 6
  faqs: yup.array(yup.object({
    q: yup.string().required("Question is required"),
    a: yup.string(),
  })),
})

const STEP_FIELDS: Record<number, (keyof ProgramFormValues)[]> = {
  1: ["title", "slug", "thumbnail", "price", "level", "categoryId", "tagline", "featured", "published"],
  2: ["description", "duration", "format", "startDate", "endDate", "cohortSize", "rating", "reviewCount", "enrolledCount", "countriesCount"],
  3: ["overview", "targetAudience", "learningObjectives", "whatIsIncluded"],
  4: ["curriculum"],
  5: ["instructorName", "instructorTitle", "instructorBio", "instructorCredentials"],
  6: ["faqs"],
}

// ── Inline field error ────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[11px] text-red-600 mt-0.5">{msg}</p>
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, onJump }: { current: number; onJump?: (n: number) => void }) {
  return (
    <div className="flex items-start px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9] shrink-0 overflow-x-auto">
      {STEPS.map((s, i) => {
        const n = i + 1
        const done   = n < current
        const active = n === current
        return (
          <div key={i} className="flex items-start">
            {i > 0 && (
              <div className="flex items-center pt-2.75 shrink-0">
                <div className={`h-px w-5 ${done ? "bg-[#0474C4]" : "bg-[#E5E2DC]"}`} />
              </div>
            )}
            <button
              type="button"
              onClick={() => onJump?.(n)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group px-1"
            >
              <span className={`w-5.5 h-5.5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                done   ? "bg-[#0474C4] text-white" :
                active ? "bg-[#0474C4] text-white shadow-sm shadow-[#0474C4]/30" :
                         "bg-[#E5E2DC] text-[#A8A39C] group-hover:bg-[#C8E4F8] group-hover:text-[#0474C4]"
              }`}>
                {done
                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : n}
              </span>
              <span className={`text-[9px] font-semibold tracking-wide whitespace-nowrap ${
                active ? "text-[#0474C4]" : done ? "text-[#0474C4]/60" : "text-[#A8A39C]"
              }`}>{s.label}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Dynamic list editors ──────────────────────────────────────────────────────

function StringListEditor({
  items, onChange, placeholder, addLabel = "Add item",
}: {
  items:        string[]
  onChange:     (v: string[]) => void
  placeholder?: string
  addLabel?:    string
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n) }}
            className={inputCls}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="w-8 h-9 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 shrink-0 cursor-pointer"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors cursor-pointer mt-1"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {addLabel}
      </button>
    </div>
  )
}

// ── Rich text editor (TipTap) ─────────────────────────────────────────────────

function RichTextEditor({ value, onChange, placeholder }: {
  value:        string
  onChange:     (v: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "px-3 py-2.5 min-h-[140px] text-[13px] text-[#1A1916] outline-none [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:space-y-1 [&_p]:leading-relaxed",
      },
    },
  })

  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value || "")
    }
  }, [value, editor])

  function tb(active: boolean, label: React.ReactNode, action: () => void) {
    return (
      <button
        type="button"
        onClick={action}
        className={`w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors cursor-pointer ${
          active ? "bg-[#0474C4] text-white" : "text-[#6B6560] hover:bg-[#E5E2DC]"
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="border border-[#E5E2DC] rounded-[10px] overflow-hidden focus-within:border-[#0474C4] transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#E5E2DC] bg-[#FAFAF9]">
        {tb(!!editor?.isActive("bold"),        <b>B</b>,  () => editor?.chain().focus().toggleBold().run())}
        {tb(!!editor?.isActive("italic"),      <em>I</em>, () => editor?.chain().focus().toggleItalic().run())}
        {tb(!!editor?.isActive("bulletList"),
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>,
          () => editor?.chain().focus().toggleBulletList().run()
        )}
        {tb(!!editor?.isActive("orderedList"),
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>,
          () => editor?.chain().focus().toggleOrderedList().run()
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

// ── Star rating picker ────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const current = parseFloat(value) || 0
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(current === n ? "" : String(n))}
          className={`cursor-pointer transition-colors ${n <= current ? "text-amber-400" : "text-[#D9D6CF] hover:text-amber-300"}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={n <= current ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
      {current > 0 && <span className="text-[12px] text-[#6B6560] ml-0.5">{current} / 5</span>}
    </div>
  )
}

// ── Lessons editor (nested within a module) ───────────────────────────────────

function LessonsEditor({
  control, register, errors, moduleIndex,
}: {
  control:     Control<ProgramFormValues>
  register:    UseFormRegister<ProgramFormValues>
  errors:      FieldErrors<ProgramFormValues>
  moduleIndex: number
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `curriculum.${moduleIndex}.lessons` as any,
  })

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-[#6B6560] uppercase tracking-[0.4px]">Lessons</p>
      {fields.map((field, j) => (
        <div key={field.id} className="border border-[#E5E2DC] rounded-[10px] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-[#F5F4F1] border-b border-[#E5E2DC]">
            <span className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wide">Lesson {j + 1}</span>
            <button type="button" onClick={() => remove(j)} className="w-5 h-5 flex items-center justify-center rounded-full text-[#A8A39C] hover:bg-red-50 hover:text-red-500 cursor-pointer">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="px-3 py-3 space-y-3">
            <Field label="Title">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <input {...register(`curriculum.${moduleIndex}.lessons.${j}.title` as any)} className={inputCls} placeholder="e.g. Introduction to Results Frameworks" />
              <FieldError msg={(errors.curriculum?.[moduleIndex] as any)?.lessons?.[j]?.title?.message} />
            </Field>
            <Field label="Short Description">
              <Controller
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={`curriculum.${moduleIndex}.lessons.${j}.description` as any}
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={(field.value as string) ?? ""}
                    onChange={field.onChange}
                    placeholder="Brief description of this lesson…"
                  />
                )}
              />
            </Field>
            <Field label="Embedded Content" hint="Video / Google Doc / Learning material URLs">
              <Controller
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={`curriculum.${moduleIndex}.lessons.${j}.embedUrls` as any}
                control={control}
                render={({ field }) => (
                  <StringListEditor
                    items={(field.value as string[]) ?? []}
                    onChange={field.onChange}
                    placeholder="https://youtu.be/... or https://docs.google.com/..."
                    addLabel="Add embed"
                  />
                )}
              />
            </Field>
            <Field label="Reference Materials" hint="Supporting resource URLs">
              <Controller
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={`curriculum.${moduleIndex}.lessons.${j}.referenceUrls` as any}
                control={control}
                render={({ field }) => (
                  <StringListEditor
                    items={(field.value as string[]) ?? []}
                    onChange={field.onChange}
                    placeholder="https://resource.org/..."
                    addLabel="Add reference"
                  />
                )}
              />
            </Field>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ title: "", description: "", embedUrls: [], referenceUrls: [] } as never)}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors cursor-pointer"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Lesson
      </button>
    </div>
  )
}

// ── Curriculum module card (watches isAssessment for conditional render) ───────

function CurriculumModuleCard({
  control, register, errors, index, onRemove,
}: {
  control:  Control<ProgramFormValues>
  register: UseFormRegister<ProgramFormValues>
  errors:   FieldErrors<ProgramFormValues>
  index:    number
  onRemove: () => void
}) {
  const isAssessment = useWatch({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `curriculum.${index}.isAssessment` as any,
  })

  return (
    <div className="border border-[#E5E2DC] rounded-[12px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-b border-[#E5E2DC]">
        <span className="text-[11px] font-bold text-[#0474C4] uppercase tracking-wide">Module {index + 1}</span>
        <button type="button" onClick={onRemove} className="w-6 h-6 flex items-center justify-center rounded-full text-[#A8A39C] hover:bg-red-50 hover:text-red-500 cursor-pointer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Week">
            <input {...register(`curriculum.${index}.week`)} className={inputCls} placeholder="e.g. Week 1" />
          </Field>
          <Field label="Title">
            <input {...register(`curriculum.${index}.title`)} className={inputCls} placeholder="e.g. Foundations of M&E" />
            <FieldError msg={errors.curriculum?.[index]?.title?.message} />
          </Field>
        </div>
        <Field label="Description">
          <Controller
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={`curriculum.${index}.desc` as any}
            control={control}
            render={({ field }) => (
              <RichTextEditor
                value={(field.value as string) ?? ""}
                onChange={field.onChange}
                placeholder="Brief overview of this module…"
              />
            )}
          />
        </Field>
        <div className="flex items-center gap-3 py-1">
          <Controller
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={`curriculum.${index}.isAssessment` as any}
            control={control}
            render={({ field }) => (
              <Toggle label="Assessment Module" checked={!!field.value} onChange={field.onChange} />
            )}
          />
        </div>
        {isAssessment && (
          <Field label="Assessment Link" hint="Google Form, Typeform, etc.">
            <input
              {...register(`curriculum.${index}.assessmentLink`)}
              className={inputCls}
              placeholder="https://forms.google.com/..."
            />
          </Field>
        )}
        <LessonsEditor control={control} register={register} errors={errors} moduleIndex={index} />
      </div>
    </div>
  )
}

// ── Curriculum editor ─────────────────────────────────────────────────────────

function CurriculumEditor({
  control, register, errors,
}: {
  control:  Control<ProgramFormValues>
  register: UseFormRegister<ProgramFormValues>
  errors:   FieldErrors<ProgramFormValues>
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "curriculum" })
  return (
    <div className="space-y-3">
      {fields.map((field, i) => (
        <CurriculumModuleCard
          key={field.id}
          control={control}
          register={register}
          errors={errors}
          index={i}
          onRemove={() => remove(i)}
        />
      ))}
      <button
        type="button"
        onClick={() => append({
          week: `Week ${fields.length + 1}`, title: "", desc: "",
          isAssessment: false, assessmentLink: "", lessons: [],
        })}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Module
      </button>
    </div>
  )
}

function FaqEditor({
  control, register, errors,
}: {
  control:  Control<ProgramFormValues>
  register: UseFormRegister<ProgramFormValues>
  errors:   FieldErrors<ProgramFormValues>
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "faqs" })
  return (
    <div className="space-y-3">
      {fields.map((field, i) => (
        <div key={field.id} className="border border-[#E5E2DC] rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-b border-[#E5E2DC]">
            <span className="text-[11px] font-bold text-[#6B6560] uppercase tracking-wide">FAQ {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="w-6 h-6 flex items-center justify-center rounded-full text-[#A8A39C] hover:bg-red-50 hover:text-red-500 cursor-pointer"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="px-4 py-3 space-y-3">
            <Field label="Question">
              <input {...register(`faqs.${i}.q`)} className={inputCls} placeholder="e.g. Do I need prior M&E experience to enrol?" />
              <FieldError msg={errors.faqs?.[i]?.q?.message} />
            </Field>
            <Field label="Answer">
              <textarea {...register(`faqs.${i}.a`)} rows={3} className={inputCls} placeholder="Provide a clear, helpful answer…" />
            </Field>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ q: "", a: "" })}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add FAQ
      </button>
    </div>
  )
}

function ProgramModal({
  program, categories, onSave, onClose,
}: {
  program:    Program | null
  categories: Category[]
  onSave:     (values: ProgramFormValues) => Promise<void>
  onClose:    () => void
}) {
  const [step,        setStep]        = useState(1)
  const [saving,      setSaving]      = useState(false)
  const [serverError, setServerError] = useState("")

  const defaultValues: ProgramFormValues = program ? {
    title:      program.title,
    slug:       program.slug,
    thumbnail:  program.thumbnail ?? "",
    price:      String(program.price),
    level:      program.level,
    categoryId: program.categoryId ?? "",
    tagline:    program.tagline    ?? "",
    featured:   program.featured,
    published:  program.published,
    description:    program.description,
    duration:       program.duration    ?? "",
    format:         program.format      ?? "",
    startDate:      program.startDate    ?? "",
    endDate:        program.endDate      ?? "",
    cohortSize:     program.cohortSize  != null ? String(program.cohortSize)    : "",
    rating:         program.rating      != null ? String(program.rating)         : "",
    reviewCount:    program.reviewCount != null ? String(program.reviewCount)    : "",
    enrolledCount:  program.enrolledCount  != null ? String(program.enrolledCount)  : "",
    countriesCount: program.countriesCount != null ? String(program.countriesCount) : "",
    overview:       program.overview ?? "",
    targetAudience: Array.isArray(program.targetAudience) ? (program.targetAudience as string[]) : [],
    learningObjectives: Array.isArray(program.learningObjectives) ? (program.learningObjectives as string[]) : [],
    whatIsIncluded: Array.isArray(program.whatIsIncluded)  ? (program.whatIsIncluded as string[])  : [],
    instructorName:       program.instructorName      ?? "",
    instructorTitle:      program.instructorTitle     ?? "",
    instructorBio:        program.instructorBio       ?? "",
    instructorCredentials: Array.isArray(program.instructorCredentials) ? (program.instructorCredentials as string[]) : [],
    curriculum: Array.isArray(program.curriculum)
      ? (program.curriculum as Record<string, unknown>[]).map(m => ({
          week:           String(m.week           ?? ""),
          title:          String(m.title          ?? ""),
          desc:           String(m.desc           ?? ""),
          isAssessment:   Boolean(m.isAssessment  ?? false),
          assessmentLink: String(m.assessmentLink ?? ""),
          lessons: Array.isArray(m.lessons)
            ? (m.lessons as Record<string, unknown>[]).map(l => ({
                title:         String(l.title       ?? ""),
                description:   String(l.description ?? ""),
                embedUrls:     Array.isArray(l.embedUrls)     ? l.embedUrls     as string[] : [],
                referenceUrls: Array.isArray(l.referenceUrls) ? l.referenceUrls as string[] : [],
              }))
            : [],
        }))
      : [],
    faqs: Array.isArray(program.faqs) ? (program.faqs as FaqItem[]) : [],
  } : EMPTY_FORM

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ProgramFormValues>({ resolver: yupResolver(programSchema) as any, defaultValues })

  // Auto-generate slug from title when creating
  const watchedTitle = watch("title")
  useEffect(() => {
    if (!program) {
      setValue("slug", slugify(watchedTitle ?? ""), { shouldValidate: false, shouldDirty: false })
    }
  }, [watchedTitle, program, setValue])

  // Auto-compute end date from start date + duration (weeks)
  const watchedStartDate = watch("startDate")
  const watchedDuration  = watch("duration")
  useEffect(() => {
    const weeks = parseInt(watchedDuration ?? "") || 0
    if (watchedStartDate && weeks > 0) {
      const d = new Date(watchedStartDate)
      d.setDate(d.getDate() + weeks * 7)
      setValue("endDate", d.toISOString().split("T")[0], { shouldValidate: false, shouldDirty: false })
    }
  }, [watchedStartDate, watchedDuration, setValue])

  async function handleNext() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valid = await trigger(STEP_FIELDS[step] as any)
    if (valid) {
      setServerError("")
      setStep(s => Math.min(s + 1, STEPS.length))
    }
  }

  function handleBack() {
    setServerError("")
    setStep(s => Math.max(s - 1, 1))
  }

  async function onSubmit(values: ProgramFormValues) {
    setSaving(true)
    setServerError("")
    try { await onSave(values) }
    catch (e) { setServerError(e instanceof Error ? e.message : "Something went wrong.") }
    finally { setSaving(false) }
  }

  const isLast = step === STEPS.length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#EEF6FF] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0474C4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1A1916] leading-tight">
                {program ? "Edit Program" : "New Program"}
              </h2>
              <p className="text-[12px] text-[#A8A39C] mt-0.5">{STEPS[step - 1].desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F4F1] text-[#A8A39C] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Step indicator */}
        <StepIndicator
          current={step}
          onJump={program ? n => { setServerError(""); setStep(n) } : undefined}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {serverError && (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{serverError}</p>
          )}

          {/* Step 1 — Basic Info */}
          {step === 1 && <>
            <Field label="Thumbnail">
              <Controller
                name="thumbnail"
                control={control}
                render={({ field }) => <ThumbnailUpload value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <Field label="Title" required>
              <input autoFocus {...register("title")} className={inputCls} placeholder="e.g. African Policy Leadership Programme" />
              <FieldError msg={errors.title?.message} />
            </Field>
            <Field label="Slug" hint="Auto-generated from title">
              <input {...register("slug")} className={inputCls} placeholder="e.g. african-policy-leadership-programme" />
              <FieldError msg={errors.slug?.message} />
            </Field>
            <Field label="Tagline" hint="Short subtitle shown on listing cards">
              <input {...register("tagline")} className={inputCls} placeholder="e.g. Master results-based frameworks and evaluation methods" />
              <FieldError msg={errors.tagline?.message} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Category">
                <select {...register("categoryId")} className={inputCls}>
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Level" required>
                <select {...register("level")} className={inputCls}>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
                <FieldError msg={errors.level?.message} />
              </Field>
            </div>
            <Field label="Price" hint="0 = Free">
              <input type="number" min="0" step="0.01" {...register("price")} className={inputCls} placeholder="0" />
              <FieldError msg={errors.price?.message} />
            </Field>
            <div className="flex items-center gap-6 pt-1">
              <Controller
                name="featured"
                control={control}
                render={({ field }) => <Toggle label="Featured" checked={!!field.value} onChange={field.onChange} />}
              />
              <Controller
                name="published"
                control={control}
                render={({ field }) => <Toggle label="Published" checked={!!field.value} onChange={field.onChange} />}
              />
            </div>
          </>}

          {/* Step 2 — Programme Info */}
          {step === 2 && <>
            <Field label="Description" required>
              <textarea {...register("description")} rows={5} className={inputCls} placeholder="A detailed overview of this programme…" />
              <FieldError msg={errors.description?.message} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Duration" hint="Weeks">
                <input type="number" min="1" {...register("duration")} className={inputCls} placeholder="e.g. 8" />
              </Field>
              <Field label="Format">
                <Controller
                  name="format"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-auto px-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none focus:border-[#0474C4] transition-colors data-placeholder:text-[#A8A39C]">
                        <SelectValue placeholder="— Select —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Self-Paced">Self-Paced</SelectItem>
                        <SelectItem value="Cohort Based">Cohort Based</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Start Date">
                <input type="date" {...register("startDate")} className={inputCls} />
              </Field>
              <Field label="End Date" hint="Auto-calculated from start date + duration">
                <input type="date" {...register("endDate")} readOnly className={`${inputCls} bg-[#FAFAF9] text-[#6B6560] cursor-default`} />
              </Field>
              <Field label="Program Pool Size">
                <input type="number" min="1" {...register("cohortSize")} className={inputCls} placeholder="e.g. 35" />
              </Field>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#6B6560] uppercase tracking-[0.4px] mb-3 border-b border-[#E5E2DC] pb-2">Social Proof</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Rating">
                  <Controller
                    name="rating"
                    control={control}
                    render={({ field }) => <StarRating value={field.value ?? ""} onChange={field.onChange} />}
                  />
                  <FieldError msg={errors.rating?.message} />
                </Field>
                <Field label="Reviews">
                  <input type="number" min="0" {...register("reviewCount")} className={inputCls} placeholder="312" />
                </Field>
                <Field label="Enrolled" hint="Display">
                  <input type="number" min="0" {...register("enrolledCount")} className={inputCls} placeholder="2100" />
                </Field>
                <Field label="Countries">
                  <input type="number" min="0" {...register("countriesCount")} className={inputCls} placeholder="120" />
                </Field>
              </div>
            </div>
          </>}

          {/* Step 3 — Objectives */}
          {step === 3 && <>
            <Field label="Overview">
              <Controller
                name="overview"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="A short overview of what this programme is about…"
                  />
                )}
              />
            </Field>
            <Field label="Learning Objectives">
              <Controller
                name="learningObjectives"
                control={control}
                render={({ field }) => (
                  <StringListEditor
                    items={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="e.g. Design results-based M&E frameworks aligned to programme logics"
                    addLabel="Add objective"
                  />
                )}
              />
            </Field>
            <Field label="Target Audience">
              <Controller
                name="targetAudience"
                control={control}
                render={({ field }) => (
                  <StringListEditor
                    items={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="e.g. Mid-career development practitioners"
                    addLabel="Add audience"
                  />
                )}
              />
            </Field>
            <Field label="What's Included">
              <Controller
                name="whatIsIncluded"
                control={control}
                render={({ field }) => (
                  <StringListEditor
                    items={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="e.g. 8 live virtual sessions (recorded)"
                    addLabel="Add item"
                  />
                )}
              />
            </Field>
          </>}

          {/* Step 4 — Curriculum */}
          {step === 4 && <>
            <p className="text-[13px] text-[#6B6560] leading-relaxed">
              Build the weekly programme outline. Each module appears as an accordion on the public page.
            </p>
            <CurriculumEditor control={control} register={register} errors={errors} />
          </>}

          {/* Step 5 — Facilitator */}
          {step === 5 && <>
            <Field label="Full Name">
              <input {...register("instructorName")} className={inputCls} placeholder="e.g. Dr. Rachel Osei" />
            </Field>
            <Field label="Title / Role">
              <input {...register("instructorTitle")} className={inputCls} placeholder="e.g. Senior Researcher & M&E Specialist · ARPS Institute" />
            </Field>
            <Field label="Biography">
              <Controller
                name="instructorBio"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Short biography of the programme facilitator…"
                  />
                )}
              />
            </Field>
            <Field label="Credentials">
              <Controller
                name="instructorCredentials"
                control={control}
                render={({ field }) => (
                  <StringListEditor
                    items={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="e.g. PhD Research Methods — University of Ghana"
                    addLabel="Add credential"
                  />
                )}
              />
            </Field>
          </>}

          {/* Step 6 — FAQs */}
          {step === 6 && <>
            <p className="text-[13px] text-[#6B6560] leading-relaxed">
              Add frequently asked questions shown in an accordion on the programme page.
            </p>
            <FaqEditor control={control} register={register} errors={errors} />
          </>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E2DC] bg-[#FAFAF9] shrink-0">
          <span className="text-[12px] text-[#A8A39C] font-medium">
            Step <span className="text-[#1A1916] font-bold">{step}</span> of {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={step === 1 ? onClose : handleBack}
              className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={saving}
                className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving…" : program ? "Save Changes" : "Create Program"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] cursor-pointer"
              >
                Next
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#E5E2DC]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#EEF6FF] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0474C4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1A1916] leading-tight">{category ? "Edit Category" : "New Category"}</h2>
              <p className="text-[12px] text-[#A8A39C] mt-0.5">{category ? "Update the category name." : "Create a new program category."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F4F1] text-[#A8A39C] cursor-pointer shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Policy Research" className={inputCls} required />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
              {saving ? "Saving…" : category ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminProgramsPage() {
  const [tab, setTab] = useState<Tab>("programs")

  // Programs
  const [programs, setPrograms]               = useState<Program[]>([])
  const [programsLoading, setProgramsLoading] = useState(true)
  const [search, setSearch]                   = useState("")
  const [levelFilter, setLevelFilter]         = useState<CourseLevel | "All">("All")
  const [statusFilter, setStatusFilter]       = useState<"All" | "Published" | "Drafts" | "Featured">("All")
  const [programModal, setProgramModal]       = useState<"create" | Program | null>(null)
  const [deleteProgram, setDeleteProgram]     = useState<Program | null>(null)
  const [togglingIds, setTogglingIds]         = useState<Set<string>>(new Set())
  const [filterOpen, setFilterOpen]           = useState(false)
  const [statusOpen, setStatusOpen]           = useState(false)
  const filterRef                             = useRef<HTMLDivElement>(null)
  const statusRef                             = useRef<HTMLDivElement>(null)

  // Categories
  const [categories, setCategories]                 = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading]   = useState(true)
  const [categorySearch, setCategorySearch]         = useState("")
  const [categoryModal, setCategoryModal]           = useState<"create" | Category | null>(null)
  const [deleteCategory, setDeleteCategory]         = useState<Category | null>(null)

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

  useEffect(() => { fetchPrograms(); fetchCategories() }, [fetchPrograms, fetchCategories])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // ── CSV export ─────────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = ["Title", "Slug", "Category", "Level", "Price", "Instructor", "Enrolled", "Status", "Featured", "Created"]
    const rows = filteredPrograms.map(p => [
      `"${p.title.replace(/"/g, '""')}"`,
      p.slug,
      p.category?.name ?? "",
      LEVEL_LABELS[p.level],
      fmtPrice(p.price),
      instructorName(p),
      String(p._count.enrollments),
      p.published ? "Published" : "Draft",
      p.featured  ? "Yes" : "No",
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
    const editing = programModal !== "create" ? programModal : null

    const curriculumPayload = values.curriculum
      .filter(m => m.title.trim())
      .map(m => ({
        week:           m.week,
        title:          m.title,
        desc:           m.desc || null,
        isAssessment:   m.isAssessment,
        assessmentLink: m.isAssessment ? (m.assessmentLink || null) : null,
        lessons: !m.isAssessment
          ? m.lessons
              .filter(l => l.title.trim())
              .map(l => ({
                title:         l.title,
                description:   l.description || null,
                embedUrls:     l.embedUrls.filter(Boolean),
                referenceUrls: l.referenceUrls.filter(Boolean),
              }))
          : [],
      }))

    const faqsPayload = values.faqs.filter(f => f.q.trim())

    const payload = {
      title:       values.title,
      slug:        values.slug || slugify(values.title),
      description: values.description,
      thumbnail:   values.thumbnail || null,
      price:       parseFloat(values.price) || 0,
      level:       values.level,
      categoryId:  values.categoryId || null,
      featured:    values.featured,
      published:   values.published,

      tagline:        values.tagline        || null,
      duration:       values.duration       || null,
      format:         values.format         || null,
      startDate:      values.startDate       || null,
      endDate:        values.endDate         || null,
      cohortSize:     values.cohortSize      ? parseInt(values.cohortSize)    : null,
      rating:         values.rating         ? parseFloat(values.rating)       : null,
      reviewCount:    values.reviewCount    ? parseInt(values.reviewCount)    : null,
      enrolledCount:  values.enrolledCount  ? parseInt(values.enrolledCount)  : null,
      countriesCount: values.countriesCount ? parseInt(values.countriesCount) : null,

      overview:              values.overview || null,
      targetAudience:        filterArr(values.targetAudience),
      learningObjectives:    filterArr(values.learningObjectives),
      whatIsIncluded:        filterArr(values.whatIsIncluded),
      instructorName:        values.instructorName      || null,
      instructorTitle:       values.instructorTitle     || null,
      instructorInitials:    values.instructorName
        ? values.instructorName.split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).join("").slice(0, 4)
        : null,
      instructorBio:         values.instructorBio       || null,
      instructorCredentials: filterArr(values.instructorCredentials),
      curriculum:            curriculumPayload.length > 0 ? curriculumPayload : null,
      faqs:                  faqsPayload.length     > 0 ? faqsPayload     : null,
    }
    const res  = await fetch(editing ? `/api/programs/${editing.id}` : "/api/programs", {
      method:  editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save program.")
    setProgramModal(null)
    await fetchPrograms()
  }

  async function handleTogglePublished(p: Program) {
    setTogglingIds(prev => new Set(prev).add(p.id))
    try {
      const r = await fetch(`/api/programs/${p.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ published: !p.published }),
      })
      if (r.ok) {
        setPrograms(prev => prev.map(x => x.id === p.id ? { ...x, published: !x.published } : x))
      }
    } finally {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(p.id); return s })
    }
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
    const matchStatus =
      statusFilter === "All"       ? true :
      statusFilter === "Published" ? p.published :
      statusFilter === "Drafts"    ? !p.published :
      statusFilter === "Featured"  ? p.featured : true

    const matchLevel = levelFilter === "All" || p.level === levelFilter

    const q = search.toLowerCase()
    return matchStatus && matchLevel && (
      !q ||
      p.title.toLowerCase().includes(q) ||
      instructorName(p).toLowerCase().includes(q) ||
      (p.category?.name ?? "").toLowerCase().includes(q)
    )
  })

  const filteredCategories = categories.filter(c =>
    !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const counts = {
    all:       programs.length,
    published: programs.filter(p => p.published).length,
    draft:     programs.filter(p => !p.published).length,
    featured:  programs.filter(p => p.featured).length,
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Programs</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Manage learning programs and categories</p>
        </div>
        <button
          onClick={() => tab === "programs" ? setProgramModal("create") : setCategoryModal("create")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {tab === "programs" ? "New Program" : "New Category"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#F5F4F1] rounded-[12px] p-1 w-fit">
        {(["programs", "categories"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-[9px] text-[13px] font-semibold capitalize transition-colors cursor-pointer ${tab === t ? "bg-white text-[#1A1916] shadow-sm" : "text-[#6B6560] hover:text-[#1A1916]"}`}>
            {t}
            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t ? "bg-[#F5F4F1] text-[#6B6560]" : "bg-[#E5E2DC] text-[#A8A39C]"}`}>
              {t === "programs" ? programs.length : categories.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── PROGRAMS TAB ──────────────────────────────────────────────────────── */}
      {tab === "programs" && (
        <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Status filter */}
              <div ref={statusRef} className="relative">
                <button
                  onClick={() => setStatusOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${statusFilter !== "All" ? "bg-[#0474C4] text-white border-[#0474C4]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Status
                  {statusFilter !== "All" && <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{statusFilter}</span>}
                </button>
                {statusOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-36">
                    {([
                      ["All",       counts.all],
                      ["Published", counts.published],
                      ["Drafts",    counts.draft],
                      ["Featured",  counts.featured],
                    ] as const).map(([label, count]) => (
                      <button key={label} onClick={() => { setStatusFilter(label as typeof statusFilter); setStatusOpen(false) }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${statusFilter === label ? "bg-[#EEF6FF] text-[#0474C4]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"}`}
                      >
                        <span>{label === "All" ? "All Statuses" : label}</span>
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F5F4F1] text-[#6B6560]">{count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Level filter */}
              <div ref={filterRef} className="relative">
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${levelFilter !== "All" ? "bg-[#0474C4] text-white border-[#0474C4]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Level
                  {levelFilter !== "All" && <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{LEVEL_LABELS[levelFilter]}</span>}
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-36">
                    {(["All", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map(l => (
                      <button key={l} onClick={() => { setLevelFilter(l); setFilterOpen(false) }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${levelFilter === l ? "bg-[#FEF3C7] text-[#0474C4]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"}`}
                      >
                        {l === "All" ? "All Levels" : LEVEL_LABELS[l]}
                        {levelFilter === l && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export CSV */}
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] bg-white hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                  {["Program", "Category", "Level", "Price", "Enrolled", "Status", ""].map((col, i) => (
                    <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {programsLoading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C]">Loading…</td></tr>
                ) : filteredPrograms.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C]">No programs found.</td></tr>
                ) : filteredPrograms.map(p => (
                  <tr key={p.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">

                    {/* Program info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.thumbnail ? (
                          <div className="relative w-9 h-9 rounded-[8px] overflow-hidden shrink-0 border border-[#E5E2DC]">
                            <Image src={p.thumbnail} alt={p.title} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-[8px] bg-[#EEF6FF] flex items-center justify-center shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0474C4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#1A1916] leading-tight line-clamp-1">{p.title}</p>
                          <p className="text-[11px] text-[#A8A39C] mt-0.5">{instructorName(p)}</p>
                          {p.featured && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#0474C4] mt-0.5">
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
                        ? <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-semibold">{p.category.name}</span>
                        : <span className="text-[#A8A39C]">—</span>}
                    </td>

                    {/* Level */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${LEVEL_COLORS[p.level]}`}>
                        {LEVEL_LABELS[p.level]}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[12px] font-semibold ${p.price === 0 ? "text-emerald-600" : "text-[#1A1916]"}`}>
                        {fmtPrice(p.price)}
                      </span>
                    </td>

                    {/* Enrolled */}
                    <td className="px-4 py-3 whitespace-nowrap text-[#6B6560]">
                      {p._count.enrollments}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge published={p.published} onClick={() => handleTogglePublished(p)} loading={togglingIds.has(p.id)} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setProgramModal(p)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] hover:bg-amber-50 cursor-pointer transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteProgram(p)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
            <p className="text-[11px] text-[#A8A39C]">Showing <span className="font-semibold text-[#6B6560]">{filteredPrograms.length}</span> of <span className="font-semibold text-[#6B6560]">{programs.length}</span> programs</p>
            {filteredPrograms.length < programs.length && <p className="text-[11px] text-[#0474C4] font-semibold">{programs.length - filteredPrograms.length} filtered out</p>}
          </div>
        </div>
      )}

      {/* ── CATEGORIES TAB ────────────────────────────────────────────────────── */}
      {tab === "categories" && (
        <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
          <div className="flex gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="Search categories…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                  {["Name", "Slug", "Programs", "Created", ""].map(col => (
                    <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoriesLoading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C]">Loading…</td></tr>
                ) : filteredCategories.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C]">No categories yet.</td></tr>
                ) : filteredCategories.map(cat => (
                  <tr key={cat.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#1A1916] whitespace-nowrap">{cat.name}</td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{cat.slug}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] text-[#6B6560] text-[11px] font-semibold">{cat._count.courses}</span></td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(cat.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCategoryModal(cat)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] hover:bg-amber-50 cursor-pointer transition-colors">
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

          <div className="px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
            <p className="text-[11px] text-[#A8A39C]"><span className="font-semibold text-[#6B6560]">{categories.length}</span> {categories.length === 1 ? "category" : "categories"} total</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {programModal !== null && (
        <ProgramModal
          program={programModal === "create" ? null : programModal}
          categories={categories}
          onSave={handleSaveProgram}
          onClose={() => setProgramModal(null)}
        />
      )}
      {categoryModal !== null && (
        <CategoryModal category={categoryModal === "create" ? null : categoryModal} onSave={handleSaveCategory} onClose={() => setCategoryModal(null)} />
      )}
      {deleteProgram && (
        <ConfirmDialog message={`Delete "${deleteProgram.title}"? This cannot be undone.`} onConfirm={handleDeleteProgram} onCancel={() => setDeleteProgram(null)} />
      )}
      {deleteCategory && (
        <ConfirmDialog message={`Delete category "${deleteCategory.name}"? This cannot be undone.`} onConfirm={handleDeleteCategory} onCancel={() => setDeleteCategory(null)} />
      )}
    </div>
  )
}
