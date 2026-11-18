"use client"

// The programme editor (create/edit modal, AI course builder). Split out of
// page.tsx so the list loads without it — TipTap, react-hook-form, yup and
// the block editor only download when an editor actually opens.

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"
import { useForm, useFieldArray, Controller, useWatch, useController } from "react-hook-form"
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import ContentBlockEditor from "@/components/forms/ContentBlockEditor"
import { RubricScopeProvider } from "@/components/rubrics/RubricScope"
import FullRichTextEditor from "@/components/ui/RichTextEditor"
import { SearchableSelect } from "@/components/ui/SearchableSelect"
import type { ContentBlock } from "@/components/forms/ContentBlockEditor"
import AiFieldBuilderModal from "@/components/forms/AiFieldBuilderModal"
import { toast } from "sonner"
import { buildCourse, regenerateLesson, type Progress } from "@/lib/ai-course-client"
import { formatDuration, parseDuration, MAX_DURATION_WEEKS } from "@/lib/program-duration"
import FacilitatorPicker from "@/components/facilitators/FacilitatorPicker"
import { DEFAULT_PROGRAMME_FACILITATOR, readProgrammeFacilitators } from "@/components/facilitators/types"
import { TickProgress } from "@/components/ui/TickProgress"
import { type CourseLevel, type Category, type Program, type Lookup, type FacilitatorItem, slugify, inputCls, Field, AiBuilderTrigger, Toggle } from "./program-shared"




// ── Thumbnail upload ───────────────────────────────────────────────────────────

export function ThumbnailUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
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
        <div className="relative w-full h-32 rounded-[10px] overflow-hidden border border-[#DFE2ED]">
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
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] text-[13px] font-semibold border border-dashed border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-50 transition-colors cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {uploading ? "Uploading…" : value ? "Replace thumbnail" : "Upload thumbnail"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Program modal (multi-step) ────────────────────────────────────────────────

export type LessonFocus = "teach" | "practice" | "assess" | "reflect"

export type Lesson = {
  id:          string
  title:       string
  description: string
  /** Optional rich-text intro shown to learners above the lesson content,
   *  answering "why does this lesson matter". HTML from the same editor as
   *  the short description; absent on lessons authored before it existed. */
  orientation?: string
  blocks:      ContentBlock[]
  /** Planning metadata from the chapter agent. Persisted with the lesson so
   *  "regenerate this lesson" still has the anti-overlap context after a save;
   *  absent on lessons an admin added by hand, which regenerate fine without it. */
  focus?:        LessonFocus
  brief?:        string
  mustCover?:    string[]
  mustNotCover?: string[]
  /** Author's own estimate in minutes. Optional — when blank, the player and
   *  the study scheduler fall back to estimating from the lesson's content.
   *  See lib/lesson-duration.ts. */
  estimatedMinutes?: number | null
}
export type CurriculumItem = {
  id:      string
  title:   string
  desc:    string
  lessons: Lesson[]
}
export type FaqItem = { q: string; a: string }

export type ProgramFormValues = {
  // Step 1 — Basic Info + Programme Info (merged)
  title:       string
  slug:        string
  excerpt:     string
  thumbnail:   string
  pricing:     string
  paymentType: string
  price:       string
  level:       CourseLevel
  categoryId:  string
  tagline:     string
  featured:    boolean
  predefinedAnalytics: boolean

  format:         string
  duration:       string
  /** Editor-only: combined into `duration` (lib/program-duration). */
  durationWeeks:  string
  hoursPerWeek:   string
  startDate:      string
  endDate:        string
  cohortSize:     string
  rating:         string
  reviewCount:    string
  enrolledCount:  string
  countriesCount: string

  // Lookup-table relations (parallel to the legacy fields above)
  programLevelId:   string
  programFormatId:  string
  programPricingId: string

  // Step 2 — Objectives
  overview:           string
  outlineIntro:       string
  targetAudience:     string[]
  learningObjectives: string[]
  whatIsIncluded:     string[]

  // Step 3 — Curriculum
  curriculum: CurriculumItem[]

  // Chosen on the Facilitators step from the directory (FacilitatorPicker).
  facilitators: FacilitatorItem[]

  // Step 4 — Grading
  gradingEnabled:          boolean
  quizWeight:              string
  projectWeight:           string
  passMark:                string
  componentPassMark:       string
  maxQuizAttempts:         string
  attemptCooldownHours:    string
  maxProjectResubmissions: string

  // Step 5 — FAQs
  faqs: FaqItem[]
}

export const EMPTY_FORM: ProgramFormValues = {
  title: "", slug: "", excerpt: "", thumbnail: "",
  pricing: "free", paymentType: "", price: "0",
  level: "BEGINNER", categoryId: "", tagline: "", featured: false, predefinedAnalytics: false,
  format: "", duration: "", durationWeeks: "", hoursPerWeek: "", startDate: "", endDate: "", cohortSize: "",
  rating: "", reviewCount: "", enrolledCount: "", countriesCount: "",
  programLevelId: "", programFormatId: "", programPricingId: "",
  overview: "", outlineIntro: "", targetAudience: [], learningObjectives: [], whatIsIncluded: [],
  // New programmes credit the institute until someone is added.
  curriculum: [], facilitators: [DEFAULT_PROGRAMME_FACILITATOR], faqs: [],
  // Mirrors the column defaults in prisma/schema.prisma.
  gradingEnabled: false,
  quizWeight: "50", projectWeight: "50",
  passMark: "50", componentPassMark: "50",
  maxQuizAttempts: "3", attemptCooldownHours: "24", maxProjectResubmissions: "2",
}

// ── Format config ─────────────────────────────────────────────────────────────

export type FormatCfg = {
  durationLabel: string
  durationHint:  string
  showDates:     boolean
  showCohortSize: boolean
  endEditable:   boolean
  endHint:       string
}

export const FORMAT_CONFIGS: Record<string, FormatCfg> = {
  "Self-Paced": {
    durationLabel: "Est. Completion",
    durationHint:  "hours or weeks",
    showDates:      false,
    showCohortSize: false,
    endEditable:    false,
    endHint:        "",
  },
  "Cohort Based": {
    durationLabel: "Duration",
    durationHint:  "Weeks",
    showDates:      true,
    showCohortSize: true,
    endEditable:    false,
    endHint:        "Auto-calculated from start date + duration",
  },
  "Live Online": {
    durationLabel: "Session Duration",
    durationHint:  "hrs / session",
    showDates:      true,
    showCohortSize: false,
    endEditable:    true,
    endHint:        "Date of last session",
  },
  "Blended": {
    durationLabel: "Programme Length",
    durationHint:  "Weeks",
    showDates:      true,
    showCohortSize: false,
    endEditable:    false,
    endHint:        "Auto-calculated from start date + duration",
  },
}

// The Formats lookup names "Hybrid" and "In Person"; both run on dates like a
// blended cohort does.
FORMAT_CONFIGS["Hybrid"]    = FORMAT_CONFIGS["Blended"]
FORMAT_CONFIGS["In Person"] = FORMAT_CONFIGS["Blended"]

export const DEFAULT_FORMAT_CFG: FormatCfg = {
  durationLabel: "Duration",
  durationHint:  "Weeks",
  showDates:      false,
  showCohortSize: false,
  endEditable:    false,
  endHint:        "",
}

// ── Step definitions ──────────────────────────────────────────────────────────

export const STEPS = [
  { label: "Basic Info",   desc: "Title, pricing & schedule"    },
  { label: "Objectives",   desc: "Outcomes & target audience"   },
  { label: "Curriculum",   desc: "Programme outline"            },
  { label: "Grading",      desc: "Marks, pass marks & attempts" },
  { label: "Facilitators", desc: "Who is credited on the page"  },
  { label: "FAQs",         desc: "Frequently asked questions"   },
]


/** Collapses generated HTML to plain text, keeping paragraph and list breaks
 *  as newlines. For fields rendered as text rather than markup. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}


/** Numeric-string validators for the grading step. Empty is allowed — the
 *  save falls back to the column default rather than refusing. */
export function inRange(value: string | undefined, min: number, max: number): boolean {
  if (value === undefined || value.trim() === "") return true
  const n = Number(value)
  return Number.isInteger(n) && n >= min && n <= max
}
export const pct = (value: string | undefined) => inRange(value, 0, 100)

// ── Validation schema ─────────────────────────────────────────────────────────

export const programSchema = yup.object({
  title:       yup.string().min(3, "Title must be at least 3 characters").max(255, "Title is too long").required("Title is required"),
  slug:        yup.string().test("slug-format", "Slug must be lowercase with hyphens only", v => !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)).max(255, "Slug is too long").required("Slug is required"),
  excerpt:     yup.string().min(10, "Excerpt must be at least 10 characters").required("Excerpt / Summary is required"),
  thumbnail:   yup.string().required("Cover image is required"),
  pricing:     yup.string().oneOf(["free", "paid"], "Invalid pricing").required("Pricing is required"),
  paymentType: yup.string().when("pricing", {
    is:   "paid",
    then: s => s.required("Payment type is required for paid programmes"),
  }),
  price:       yup.string(),
  level:       yup.string().oneOf(["BEGINNER", "INTERMEDIATE", "ADVANCED"], "Invalid level").required("Level is required"),
  categoryId:  yup.string().required("Category is required"),
  tagline:     yup.string().max(500, "Tagline is too long").required("Tagline is required"),
  featured:    yup.boolean().required(),
  predefinedAnalytics: yup.boolean().required(),

  format:      yup.string(),
  duration:    yup.string(),
  durationWeeks: yup.string()
    .required("Enter the duration in weeks")
    .test("weeks", `Whole number of weeks, 1 to ${MAX_DURATION_WEEKS}`, v => {
      const n = Number(v)
      return Number.isInteger(n) && n >= 1 && n <= MAX_DURATION_WEEKS
    }),
  hoursPerWeek: yup.string().max(20, "Keep it short, e.g. 8 to 10"),
  startDate:   yup.string().when("format", {
    is:   (f: string) => ["Cohort Based", "Live Online", "Blended"].includes(f),
    then: s => s.required("Start date is required for this format"),
  }),
  endDate:     yup.string().when("format", {
    is:   (f: string) => ["Cohort Based", "Live Online", "Blended"].includes(f),
    then: s => s.required("End date is required for this format"),
  }),
  cohortSize:  yup.string().when("format", {
    is:   "Cohort Based",
    then: s => s.required("Cohort size is required"),
  }),
  rating:         yup.string().test("rating-range", "Rating must be between 0 and 5", v => !v || (parseFloat(v) >= 0 && parseFloat(v) <= 5)),
  reviewCount:    yup.string(),
  enrolledCount:  yup.string(),
  countriesCount: yup.string(),

  // Step 2
  overview:           yup.string(),
  outlineIntro:       yup.string().max(5000, "Keep the outline introduction under 5,000 characters"),
  targetAudience:     yup.array(yup.string().default("")).min(1, "Add at least one target audience entry"),
  learningObjectives: yup.array(yup.string().default("")).min(1, "Add at least one learning objective"),
  whatIsIncluded:     yup.array(yup.string().default("")).min(1, "Add at least one item"),

  // Step 3
  curriculum: yup.array(yup.object({
    id:    yup.string(),
    title: yup.string().required("Module title is required"),
    desc:  yup.string(),
    lessons: yup.array(yup.object({
      id:          yup.string(),
      title:       yup.string().required("Lesson title is required"),
      description: yup.string(),
      orientation: yup.string(),
      blocks:      yup.array(yup.mixed()).default([]),
      estimatedMinutes: yup.number().min(1).max(600).nullable().transform(v => (Number.isNaN(v) ? null : v)),
      focus:        yup.string(),
      brief:        yup.string(),
      mustCover:    yup.array(yup.string()),
      mustNotCover: yup.array(yup.string()),
    })),
  })),

  // Step 4
  // Picked from the directory (validated there); the server re-reads each
  // pick by facilitatorId, so only the name is checked here.
  facilitators: yup.array(yup.object({
    facilitatorId: yup.string(),
    name:        yup.string().required("Full name is required"),
    imageUrl:    yup.string(),
    title:       yup.string(),
    bio:         yup.string(),
    credentials: yup.string(),
  })),

  // Step 4 — Grading
  gradingEnabled: yup.boolean().default(false),
  quizWeight:     yup.string().test("0-100", "Must be between 0 and 100", pct),
  projectWeight:  yup.string()
    .test("0-100", "Must be between 0 and 100", pct)
    // A grade is quizWeight% + projectWeight% of 100, so anything else scores
    // out of the wrong total and the pass mark stops meaning what it says.
    .test("sums-to-100", "Coursework and final project weights must add up to 100", function (value) {
      const quiz = Number(this.parent.quizWeight ?? 0)
      const project = Number(value ?? 0)
      if (Number.isNaN(quiz) || Number.isNaN(project)) return true
      return quiz + project === 100
    }),
  passMark:          yup.string().test("0-100", "Must be between 0 and 100", pct),
  componentPassMark: yup.string().test("0-100", "Must be between 0 and 100", pct),
  maxQuizAttempts:      yup.string().test("range", "Must be between 0 and 20", n => inRange(n, 0, 20)),
  attemptCooldownHours: yup.string().test("range", "Must be between 0 and 168", n => inRange(n, 0, 168)),
  maxProjectResubmissions: yup.string().test("range", "Must be between 0 and 20", n => inRange(n, 0, 20)),

  // Step 5
  faqs: yup.array(yup.object({
    q: yup.string().required("Question is required"),
    a: yup.string(),
  })).min(1, "At least one FAQ is required"),
})

export const STEP_FIELDS: Record<number, (keyof ProgramFormValues)[]> = {
  1: ["title", "slug", "excerpt", "thumbnail", "pricing", "paymentType", "price", "level", "categoryId", "tagline", "featured", "durationWeeks", "hoursPerWeek", "predefinedAnalytics", "rating", "reviewCount", "enrolledCount", "countriesCount"],
  2: ["overview", "targetAudience", "learningObjectives", "whatIsIncluded"],
  3: ["outlineIntro", "curriculum"],
  4: ["gradingEnabled", "quizWeight", "projectWeight", "passMark", "componentPassMark", "maxQuizAttempts", "attemptCooldownHours", "maxProjectResubmissions"],
  5: ["facilitators"],
  6: ["faqs"],
}

// ── Inline field error ────────────────────────────────────────────────────────

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[11px] text-red-600 mt-0.5">{msg}</p>
}

// ── Step indicator ────────────────────────────────────────────────────────────

export function StepIndicator({ current, onJump }: { current: number; onJump?: (n: number) => void }) {
  return (
    <div className="flex items-start px-5 py-3 border-b border-[#DFE2ED] bg-[#FAFAFF] shrink-0 overflow-x-auto">
      {STEPS.map((s, i) => {
        const n = i + 1
        const done   = n < current
        const active = n === current
        return (
          <div key={i} className="flex items-start">
            {i > 0 && (
              <div className="flex items-center pt-2.75 shrink-0">
                <div className={`h-px w-5 ${done ? "bg-[#6655DF]" : "bg-[#DFE2ED]"}`} />
              </div>
            )}
            <button
              type="button"
              onClick={() => onJump?.(n)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group px-1"
            >
              <span className={`w-5.5 h-5.5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                done   ? "bg-[#6655DF] text-white" :
                active ? "bg-[#6655DF] text-white shadow-sm shadow-[#6655DF]/30" :
                         "bg-[#DFE2ED] text-[#8A90A6] group-hover:bg-[#DDD9F4] group-hover:text-[#6655DF]"
              }`}>
                {done
                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : n}
              </span>
              <span className={`text-[9px] font-semibold tracking-wide whitespace-nowrap ${
                active ? "text-[#6655DF]" : done ? "text-[#6655DF]/60" : "text-[#8A90A6]"
              }`}>{s.label}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Dynamic list editors ──────────────────────────────────────────────────────

export function StringListEditor({
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
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer mt-1"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {addLabel}
      </button>
    </div>
  )
}

// ── Rich text editor (TipTap) ─────────────────────────────────────────────────

export function RichTextEditor({ value, onChange, placeholder }: {
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
        class: "px-3 py-2.5 min-h-[140px] text-[13px] text-[#171C35] outline-none [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:space-y-1 [&_p]:leading-relaxed",
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
          active ? "bg-[#6655DF] text-white" : "text-[#69708A] hover:bg-[#DFE2ED]"
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="border border-[#DFE2ED] rounded-[10px] overflow-hidden focus-within:border-[#6655DF] transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#DFE2ED] bg-[#FAFAFF]">
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

export function StarRating({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const current = parseFloat(value) || 0
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(current === n ? "" : String(n))}
          className={`cursor-pointer transition-colors ${n <= current ? "text-amber-400" : "text-[#D8DAE5] hover:text-amber-300"}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={n <= current ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
      {current > 0 && <span className="text-[12px] text-[#69708A] ml-0.5">{current} / 5</span>}
    </div>
  )
}

// ── Facilitator avatar upload ─────────────────────────────────────────────────

// ── Lessons editor (nested within a chapter) ──────────────────────────────────

/** Rewrites one lesson through the same agent that wrote it during the build.
 *
 *  Two-step rather than one-click: this replaces the lesson's content outright,
 *  and by review time the admin may well have edited it by hand. */
export function RegenerateLessonButton({
  courseTitle, chapterTitle, levelLabel, lesson, onRegenerated,
}: {
  courseTitle:  string
  chapterTitle: string
  levelLabel:   string
  lesson: {
    title: string; description?: string; focus?: LessonFocus
    brief?: string; mustCover?: string[]; mustNotCover?: string[]
  }
  onRegenerated: (blocks: ContentBlock[]) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    setConfirming(false)
    try {
      const blocks = await regenerateLesson({
        provider: "anthropic",
        courseTitle, chapterTitle, levelLabel,
        // The glossary only exists during a build. A lesson regenerated after a
        // save loses that shared vocabulary, but keeps its brief and
        // mustCover/mustNotCover, which is what prevents overlap.
        glossary: [],
        lesson,
      })
      onRegenerated(blocks)
      toast.success("Lesson regenerated.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not regenerate this lesson.")
    } finally {
      setBusy(false)
    }
  }

  if (busy) {
    return <span className="text-[11px] font-bold text-[#8A90A6] uppercase tracking-[0.4px]">Regenerating…</span>
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <button type="button" onClick={run}
          className="text-[11px] font-bold text-red-600 hover:text-red-700 uppercase tracking-[0.4px] cursor-pointer">
          Replace
        </button>
        <button type="button" onClick={() => setConfirming(false)}
          className="text-[11px] font-bold text-[#8A90A6] hover:text-[#69708A] uppercase tracking-[0.4px] cursor-pointer">
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      disabled={!lesson.title.trim()}
      className="flex items-center gap-1 text-[11px] font-bold text-[#6655DF] hover:text-[#2C2368] uppercase tracking-[0.4px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
      Regenerate
    </button>
  )
}

/** Writes a whole FAQ set from what the author has already filled in.
 *
 *  Confirms before running, because it replaces the list rather than adding
 *  to it — the same two-step the lesson regenerate uses, for the same reason:
 *  the destructive reading of "regenerate" is the one people do not expect. */
export function RegenerateFaqsButton({
  context, existing, onGenerated,
}: {
  context: {
    title: string; excerpt?: string; overview?: string; level?: string
    format?: string; duration?: string; price?: string
    audience?: string[]; objectives?: string[]
  }
  existing: FaqItem[]
  onGenerated: (faqs: FaqItem[]) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const written = existing.filter(f => f.q.trim())

  async function run() {
    setBusy(true)
    setConfirming(false)
    try {
      const res = await fetch("/api/programs/ai-generate/faqs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...context, existing: written, provider: "anthropic" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not generate FAQs.")
      onGenerated(data.faqs as FaqItem[])
      toast.success(`${(data.faqs as FaqItem[]).length} FAQs generated.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate FAQs.")
    } finally {
      setBusy(false)
    }
  }

  if (busy) {
    return <span className="text-[11px] font-bold text-[#8A90A6] uppercase tracking-[0.4px]">Generating…</span>
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <button type="button" onClick={run}
          className="text-[11px] font-bold text-red-600 hover:text-red-700 uppercase tracking-[0.4px] cursor-pointer">
          Replace {written.length}
        </button>
        <button type="button" onClick={() => setConfirming(false)}
          className="text-[11px] font-bold text-[#8A90A6] hover:text-[#69708A] uppercase tracking-[0.4px] cursor-pointer">
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      // Straight to work when there is nothing to lose; confirm first when
      // there is.
      onClick={() => (written.length ? setConfirming(true) : run())}
      disabled={!context.title.trim()}
      title={context.title.trim() ? undefined : "Add a programme title first"}
      className="flex items-center gap-1 text-[11px] font-bold text-[#6655DF] hover:text-[#2C2368] uppercase tracking-[0.4px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
      {written.length ? "Regenerate all" : "Generate with AI"}
    </button>
  )
}

export function LessonItem({
  control, register, errors, moduleIndex, lessonIndex, onRemove, courseTitle, chapterTitle,
}: {
  control:      Control<ProgramFormValues>
  register:     UseFormRegister<ProgramFormValues>
  errors:       FieldErrors<ProgramFormValues>
  moduleIndex:  number
  lessonIndex:  number
  onRemove:     () => void
  courseTitle:  string
  chapterTitle: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lessonTitle = useWatch({ control, name: `curriculum.${moduleIndex}.lessons.${lessonIndex}.title` as any }) as string | undefined
  const { field: descriptionField } = useController({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `curriculum.${moduleIndex}.lessons.${lessonIndex}.description` as any,
  })
  const lessonSummary = descriptionField.value as string | undefined
  const { field: orientationField } = useController({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `curriculum.${moduleIndex}.lessons.${lessonIndex}.orientation` as any,
  })
  const { field: blocksField } = useController({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `curriculum.${moduleIndex}.lessons.${lessonIndex}.blocks` as any,
  })
  // Planning metadata from the chapter agent, if this lesson was AI-planned —
  // it's what lets a regenerate stay inside the lesson's original remit.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = useWatch({ control, name: `curriculum.${moduleIndex}.lessons.${lessonIndex}` as any }) as Lesson | undefined
  const level = (useWatch({ control, name: "level" }) as CourseLevel | undefined) ?? "BEGINNER"
  const levelLabel = level.charAt(0) + level.slice(1).toLowerCase()
  const [aiOpen, setAiOpen] = useState(false)
  const [orientationAiOpen, setOrientationAiOpen] = useState(false)

  return (
    <div className="border border-[#DFE2ED] rounded-[10px] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[#F5F6FB] border-b border-[#DFE2ED]">
        <span className="text-[10px] font-bold text-[#69708A] uppercase tracking-wide">Lesson {lessonIndex + 1}</span>
        <button type="button" onClick={onRemove} className="w-5 h-5 flex items-center justify-center rounded-full text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="px-3 py-3 space-y-3">
        <Field label="Title" required>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <input {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.title` as any)} className={inputCls} placeholder="e.g. Introduction to Results Frameworks" />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <FieldError msg={(errors.curriculum?.[moduleIndex] as any)?.lessons?.[lessonIndex]?.title?.message} />
        </Field>
        <Field label="Estimated minutes" hint="Leave blank to estimate from the lesson's content">
          <input
            type="number" min={1} max={600}
            className={inputCls}
            placeholder="auto"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.estimatedMinutes` as any, {
              setValueAs: (v: string) => (v === "" ? null : Number(v)),
            })}
          />
        </Field>
        <Field label="Short Description" action={<AiBuilderTrigger onClick={() => setAiOpen(true)} />}>
          <RichTextEditor
            value={(lessonSummary as string) ?? ""}
            onChange={descriptionField.onChange}
            placeholder="Brief description of this lesson…"
          />
        </Field>
        {aiOpen && (
          <AiFieldBuilderModal
            title="AI Builder — Lesson Description"
            kind="lesson-summary"
            context={{ courseTitle, chapterTitle, lessonTitle: lessonTitle || undefined }}
            currentValue={lessonSummary ?? ""}
            onGenerated={html => descriptionField.onChange(html)}
            onClose={() => setAiOpen(false)}
          />
        )}
        <Field
          label="Lesson Orientation"
          hint="Optional. Shown to learners above the lesson content, under “Why this lesson matters”."
          action={<AiBuilderTrigger onClick={() => setOrientationAiOpen(true)} />}
        >
          {/* The shared editor, not this file's cut-down one: orientation is
              prose a learner reads, so it needs headings, links and lists. */}
          <FullRichTextEditor
            value={(orientationField.value as string) ?? ""}
            onChange={orientationField.onChange}
            placeholder="Why this lesson matters, and what it sets up…"
            minHeight={160}
          />
        </Field>
        {orientationAiOpen && (
          <AiFieldBuilderModal
            title="AI Builder — Lesson Orientation"
            kind="lesson-orientation"
            context={{ courseTitle, chapterTitle, lessonTitle: lessonTitle || undefined }}
            currentValue={(orientationField.value as string) ?? ""}
            onGenerated={html => orientationField.onChange(html)}
            onClose={() => setOrientationAiOpen(false)}
          />
        )}
        <Field
          label="Embedded Content"
          action={
            <RegenerateLessonButton
              courseTitle={courseTitle}
              chapterTitle={chapterTitle}
              levelLabel={levelLabel}
              lesson={{
                title:        lessonTitle || "",
                description:  lessonSummary || undefined,
                focus:        plan?.focus,
                brief:        plan?.brief,
                mustCover:    plan?.mustCover,
                mustNotCover: plan?.mustNotCover,
              }}
              onRegenerated={blocks => blocksField.onChange(blocks)}
            />
          }
        >
          <ContentBlockEditor
            blocks={(blocksField.value as ContentBlock[]) ?? []}
            onChange={blocksField.onChange}
            aiContext={{
              courseTitle,
              chapterTitle,
              lessonTitle:   lessonTitle || undefined,
              lessonSummary: lessonSummary || undefined,
            }}
          />
        </Field>
      </div>
    </div>
  )
}

export function LessonsEditor({
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
  const courseTitle  = (useWatch({ control, name: "title" }) as string | undefined) ?? ""
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chapterTitle = (useWatch({ control, name: `curriculum.${moduleIndex}.title` as any }) as string | undefined) ?? ""

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-[#69708A] uppercase tracking-[0.4px]">Lessons</p>
      {fields.map((field, j) => (
        <LessonItem
          key={field.id}
          control={control}
          register={register}
          errors={errors}
          moduleIndex={moduleIndex}
          lessonIndex={j}
          onRemove={() => remove(j)}
          courseTitle={courseTitle}
          chapterTitle={chapterTitle}
        />
      ))}
      <button
        type="button"
        onClick={() => append({ id: crypto.randomUUID(), title: "", description: "", blocks: [] } as never)}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Lesson
      </button>
    </div>
  )
}

// ── Curriculum chapter card ───────────────────────────────────────────────────

export function CurriculumModuleCard({
  control, register, errors, index, onRemove,
}: {
  control:  Control<ProgramFormValues>
  register: UseFormRegister<ProgramFormValues>
  errors:   FieldErrors<ProgramFormValues>
  index:    number
  onRemove: () => void
}) {
  const courseTitle = (useWatch({ control, name: "title" }) as string | undefined) ?? ""
  const moduleTitle = (useWatch({ control, name: `curriculum.${index}.title` }) as string | undefined) ?? ""
  const { field: descField } = useController({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `curriculum.${index}.desc` as any,
  })
  const [aiOpen, setAiOpen] = useState(false)

  return (
    <div className="border border-[#DFE2ED] rounded-[12px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFF] border-b border-[#DFE2ED]">
        <span className="text-[11px] font-bold text-[#6655DF] uppercase tracking-wide">Module {index + 1}</span>
        <button type="button" onClick={onRemove} className="w-6 h-6 flex items-center justify-center rounded-full text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="px-4 py-3 space-y-3">
        <Field label="Title" required>
          <input {...register(`curriculum.${index}.title`)} className={inputCls} placeholder="e.g. Foundations of M&E" />
          <FieldError msg={errors.curriculum?.[index]?.title?.message} />
        </Field>
        <Field label="Description" action={<AiBuilderTrigger onClick={() => setAiOpen(true)} />}>
          <RichTextEditor
            value={(descField.value as string) ?? ""}
            onChange={descField.onChange}
            placeholder="Brief overview of this module…"
          />
        </Field>
        {aiOpen && (
          <AiFieldBuilderModal
            title="AI Builder — Module Description"
            kind="module"
            context={{ courseTitle, chapterTitle: moduleTitle || undefined }}
            currentValue={(descField.value as string) ?? ""}
            onGenerated={html => descField.onChange(html)}
            onClose={() => setAiOpen(false)}
          />
        )}
        <LessonsEditor control={control} register={register} errors={errors} moduleIndex={index} />
      </div>
    </div>
  )
}

// ── Curriculum editor ─────────────────────────────────────────────────────────

export function CurriculumEditor({
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
        onClick={() => append({ id: crypto.randomUUID(), title: "", desc: "", lessons: [] })}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Module
      </button>
    </div>
  )
}

// ── Facilitators editor ───────────────────────────────────────────────────────

// ── FAQ editor ────────────────────────────────────────────────────────────────

export function FaqEditor({
  control, register, errors, courseTitle,
}: {
  control:  Control<ProgramFormValues>
  register: UseFormRegister<ProgramFormValues>
  errors:   FieldErrors<ProgramFormValues>
  courseTitle: string
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "faqs" })
  /** Which row has its AI modal open, by index. */
  const [aiRow, setAiRow] = useState<number | null>(null)
  const watchedFaqs = useWatch({ control, name: "faqs" }) as FaqItem[] | undefined
  return (
    <div className="space-y-3">
      {fields.map((field, i) => (
        <div key={field.id} className="border border-[#DFE2ED] rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFF] border-b border-[#DFE2ED]">
            <span className="text-[11px] font-bold text-[#69708A] uppercase tracking-wide">FAQ {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="w-6 h-6 flex items-center justify-center rounded-full text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="px-4 py-3 space-y-3">
            <Field label="Question" required>
              <input {...register(`faqs.${i}.q`)} className={inputCls} placeholder="e.g. Do I need prior M&E experience to enrol?" />
              <FieldError msg={errors.faqs?.[i]?.q?.message} />
            </Field>
            <Field label="Answer" action={<AiBuilderTrigger onClick={() => setAiRow(i)} />}>
              <textarea {...register(`faqs.${i}.a`)} rows={3} className={inputCls} placeholder="Provide a clear, helpful answer…" />
            </Field>
          </div>
        </div>
      ))}
      {aiRow !== null && (
        <Controller
          control={control}
          name={`faqs.${aiRow}.a`}
          render={({ field }) => (
            <AiFieldBuilderModal
              title="AI Builder — FAQ Answer"
              kind="faq-answer"
              context={{ courseTitle, question: watchedFaqs?.[aiRow]?.q || undefined }}
              currentValue={(field.value as string) ?? ""}
              // This field stores plain text — both renderers print it as text
              // rather than HTML — so the generated markup is flattened rather
              // than written through and shown as literal tags.
              onGenerated={html => field.onChange(htmlToPlainText(html))}
              onClose={() => setAiRow(null)}
            />
          )}
        />
      )}

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(errors.faqs as any)?.message && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <p className="text-[11px] text-red-600">{(errors.faqs as any).message}</p>
      )}
      <button
        type="button"
        onClick={() => append({ q: "", a: "" })}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add FAQ
      </button>
    </div>
  )
}

/** Gives every rubric picker inside the editor (assignment blocks) this
 *  programme's scope, so it can offer and create programme-specific rubrics.
 *  A programme that hasn't been saved yet has no id, so no scope. */
export function ProgramModal(props: React.ComponentProps<typeof ProgramModalInner>) {
  return (
    <RubricScopeProvider value={props.program ? { courseId: props.program.id, courseTitle: props.program.title } : null}>
      <ProgramModalInner {...props} />
    </RubricScopeProvider>
  )
}

export function ProgramModalInner({
  program, initialValues, aiGenerated, categories, levels, formats, pricingOptions, onSave, onClose,
}: {
  program:        Program | null
  initialValues?: Partial<ProgramFormValues>
  aiGenerated?:   boolean
  categories:     Category[]
  levels:         Lookup[]
  formats:        Lookup[]
  pricingOptions: Lookup[]
  onSave:         (values: ProgramFormValues) => Promise<void>
  onClose:        () => void
}) {
  const [step,        setStep]        = useState(1)
  const [saving,      setSaving]      = useState(false)
  const [serverError, setServerError] = useState("")

  const defaultValues: ProgramFormValues = program ? {
    title:       program.title,
    slug:        program.slug,
    excerpt:     program.excerpt,
    thumbnail:   program.thumbnail   ?? "",
    pricing:     program.pricing     ?? "free",
    paymentType: program.paymentType ?? "",
    price:       String(program.price),
    level:       program.level,
    categoryId:  program.categoryId  ?? "",
    tagline:     program.tagline     ?? "",
    featured:    program.featured,
    predefinedAnalytics: program.predefinedAnalytics ?? false,
    format:         program.format         ?? "",
    duration:       program.duration       ?? "",
    durationWeeks:  parseDuration(program.duration).weeks,
    hoursPerWeek:   parseDuration(program.duration).hoursPerWeek,
    startDate:      program.startDate      ?? "",
    endDate:        program.endDate        ?? "",
    cohortSize:     program.cohortSize     != null ? String(program.cohortSize)     : "",
    rating:         program.rating         != null ? String(program.rating)         : "",
    reviewCount:    program.reviewCount    != null ? String(program.reviewCount)    : "",
    enrolledCount:  program.enrolledCount  != null ? String(program.enrolledCount)  : "",
    countriesCount: program.countriesCount != null ? String(program.countriesCount) : "",
    programLevelId:   program.programLevelId   ?? "",
    programFormatId:  program.programFormatId  ?? "",
    programPricingId: program.programPricingId ?? "",

    gradingEnabled:          program.gradingEnabled ?? false,
    quizWeight:              String(program.quizWeight              ?? 50),
    projectWeight:           String(program.projectWeight           ?? 50),
    passMark:                String(program.passMark                ?? 50),
    componentPassMark:       String(program.componentPassMark       ?? 50),
    maxQuizAttempts:         String(program.maxQuizAttempts         ?? 3),
    attemptCooldownHours:    String(program.attemptCooldownHours    ?? 24),
    maxProjectResubmissions: String(program.maxProjectResubmissions ?? 2),
    overview:           program.overview ?? "",
    outlineIntro:       program.outlineIntro ?? "",
    targetAudience:     Array.isArray(program.targetAudience)     ? (program.targetAudience as string[])     : [],
    learningObjectives: Array.isArray(program.learningObjectives) ? (program.learningObjectives as string[]) : [],
    whatIsIncluded:     Array.isArray(program.whatIsIncluded)     ? (program.whatIsIncluded as string[])     : [],
    curriculum: Array.isArray(program.curriculum)
      ? (program.curriculum as Record<string, unknown>[]).map(m => ({
          // Backfill a stable id for curriculum authored before lesson-level
          // completion tracking existed — it's written back on next save.
          id:    typeof m.id === "string" && m.id ? m.id : crypto.randomUUID(),
          title: String(m.title ?? ""),
          desc:  String(m.desc  ?? ""),
          lessons: Array.isArray(m.lessons)
            ? (m.lessons as Record<string, unknown>[]).map(l => ({
                id:          typeof l.id === "string" && l.id ? l.id : crypto.randomUUID(),
                title:       String(l.title       ?? ""),
                description: String(l.description ?? ""),
                blocks:      Array.isArray(l.blocks) ? l.blocks as ContentBlock[] : [],
                estimatedMinutes: typeof l.estimatedMinutes === "number" ? l.estimatedMinutes : null,
                // Planning metadata, present only on AI-planned lessons —
                // read back so regeneration still works after a reload.
                focus:        typeof l.focus === "string" ? l.focus as LessonFocus : undefined,
                brief:        typeof l.brief === "string" ? l.brief : undefined,
                orientation:  typeof l.orientation === "string" ? l.orientation : undefined,
                mustCover:    Array.isArray(l.mustCover)    ? l.mustCover    as string[] : undefined,
                mustNotCover: Array.isArray(l.mustNotCover) ? l.mustNotCover as string[] : undefined,
              }))
            : [],
        }))
      : [],
    facilitators: readProgrammeFacilitators(program.facilitators),
    faqs: Array.isArray(program.faqs) ? (program.faqs as FaqItem[]) : [],
  } : { ...EMPTY_FORM, ...initialValues }

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

  // Format-aware config
  const watchedFormat = watch("format")
  const formatCfg     = FORMAT_CONFIGS[watchedFormat] ?? DEFAULT_FORMAT_CFG

  // Predefined-analytics watcher — gates Metrics + Social Proof inputs
  const watchedPredefinedAnalytics = watch("predefinedAnalytics")

  // Pricing watcher — clear price/paymentType when free
  const watchedPricing = watch("pricing")
  useEffect(() => {
    if (watchedPricing === "free") {
      setValue("price", "0", { shouldValidate: false, shouldDirty: false })
      setValue("paymentType", "", { shouldValidate: false, shouldDirty: false })
    }
  }, [watchedPricing, setValue])

  // Auto-compute end date from start date + duration (not for Live Online)
  const watchedStartDate = watch("startDate")
  const watchedWeeks     = watch("durationWeeks")
  const watchedHours     = watch("hoursPerWeek")
  const watchedDurationText = formatDuration(watchedWeeks, watchedHours)

  // Keep the stored text in step with the two inputs. Untouched, it stays
  // exactly as saved (so e.g. "2 months" isn't rewritten just by opening it).
  const [initialDuration] = useState(() => ({
    text: defaultValues.duration, weeks: defaultValues.durationWeeks, hours: defaultValues.hoursPerWeek,
  }))
  useEffect(() => {
    const untouched = (watchedWeeks ?? "") === initialDuration.weeks && (watchedHours ?? "") === initialDuration.hours
    const next = untouched && initialDuration.text ? initialDuration.text : formatDuration(watchedWeeks, watchedHours)
    setValue("duration", next, { shouldValidate: false, shouldDirty: !untouched })
  }, [watchedWeeks, watchedHours, initialDuration, setValue])

  useEffect(() => {
    if (formatCfg.endEditable) return
    const weeks = parseInt(watchedWeeks ?? "") || 0
    if (watchedStartDate && weeks > 0) {
      const d = new Date(watchedStartDate)
      d.setDate(d.getDate() + weeks * 7)
      setValue("endDate", d.toISOString().split("T")[0], { shouldValidate: false, shouldDirty: false })
    }
  }, [watchedStartDate, watchedWeeks, formatCfg.endEditable, setValue])

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
    <div className="fixed inset-0 z-100 flex items-start justify-end bg-[#171C35]/40">
      <div className="bg-white h-full w-full max-w-6xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] px-6 py-5 shrink-0 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider">
              {program ? "Edit Program" : "New Program"}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/70 uppercase tracking-wider">
              {STEPS[step - 1].label}
            </span>
            {aiGenerated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/90 text-[#4A2E00] uppercase tracking-wider">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z"/></svg>
                AI Draft
              </span>
            )}
          </div>
          <h2 className="text-[18px] font-extrabold text-white leading-tight">
            {program ? program.title : "Create Program"}
          </h2>
          <p className="text-[12px] text-white/80 mt-1">
            {aiGenerated ? "AI-generated — review every field, then upload a cover image and save." : STEPS[step - 1].desc}
          </p>
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
            <Field label="Cover Image" required>
              <Controller
                name="thumbnail"
                control={control}
                render={({ field }) => <ThumbnailUpload value={field.value} onChange={field.onChange} />}
              />
              <FieldError msg={errors.thumbnail?.message} />
            </Field>
            <Field label="Title" required>
              <input autoFocus {...register("title")} className={inputCls} placeholder="e.g. Policy Leadership Programme" />
              <FieldError msg={errors.title?.message} />
            </Field>
            <Field label="Slug" required hint="auto-generated from title — read only">
              <input
                {...register("slug")}
                readOnly
                className={`${inputCls} bg-[#FAFAFF] text-[#69708A] cursor-default`}
              />
              <FieldError msg={errors.slug?.message} />
            </Field>
            <Field label="Tagline" required hint="Subtitle shown beneath the title">
              <input {...register("tagline")} className={inputCls} placeholder="e.g. Master results-based frameworks and evaluation methods" />
              <FieldError msg={errors.tagline?.message} />
            </Field>
            <Field label="Excerpt / Summary" required hint="Short note shown on listing cards">
              <textarea {...register("excerpt")} rows={3} className={inputCls} placeholder="A concise summary of this programme…" />
              <FieldError msg={errors.excerpt?.message} />
            </Field>
            {/* Category · Level / Programme type · Pricing */}
            <ClassificationRow control={control} setValue={setValue} errors={errors} categories={categories} formats={formats}>
              <Field label="Pricing" required>
                <Controller
                  control={control} name="pricing"
                  render={({ field }) => (
                    <SearchableSelect
                      label="Pricing" searchPlaceholder="Search pricing"
                      options={PRICING_OPTIONS}
                      value={field.value ?? ""} onChange={field.onChange}
                      invalid={!!errors.pricing}
                    />
                  )}
                />
                <FieldError msg={errors.pricing?.message} />
              </Field>
            </ClassificationRow>

            {/* Payment type · Price — only for paid programmes */}
            {watchedPricing === "paid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Payment Type" required>
                  <Controller
                    control={control} name="paymentType"
                    render={({ field }) => (
                      <SearchableSelect
                        label="Payment type" placeholder="— Select —" searchPlaceholder="Search payment types"
                        options={PAYMENT_TYPE_OPTIONS}
                        value={field.value ?? ""} onChange={field.onChange}
                        invalid={!!errors.paymentType}
                      />
                    )}
                  />
                  <FieldError msg={errors.paymentType?.message} />
                </Field>
                <Field label="Price (USD)" required>
                  <input type="number" min="0" step="0.01" {...register("price")} className={inputCls} placeholder="e.g. 499" />
                  <FieldError msg={errors.price?.message} />
                </Field>
              </div>
            )}

            {/* Duration — stored as display text ("7 weeks (8 to 10 hours per week)") */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Duration (weeks)" required hint="How long the programme runs">
                <input type="number" min={1} max={MAX_DURATION_WEEKS} step={1} inputMode="numeric" {...register("durationWeeks")} className={inputCls} placeholder="e.g. 7" />
                <FieldError msg={errors.durationWeeks?.message} />
              </Field>
              <Field label="Study time per week" hint="optional — hours, e.g. 8 to 10">
                <input {...register("hoursPerWeek")} className={inputCls} placeholder="e.g. 8 to 10" />
                <FieldError msg={errors.hoursPerWeek?.message} />
              </Field>
            </div>
            {watchedDurationText && (
              <p className="text-[12px] text-[#69708A] -mt-1">
                Shown on the programme page as <span className="font-bold text-[#171C35]">{watchedDurationText}</span>
              </p>
            )}

            <div className="flex items-center gap-6 pt-1 flex-wrap">
              <Controller
                name="featured"
                control={control}
                render={({ field }) => <Toggle label="Featured" checked={!!field.value} onChange={field.onChange} />}
              />
              <Controller
                name="predefinedAnalytics"
                control={control}
                render={({ field }) => <Toggle label="Predefined Analytics" checked={!!field.value} onChange={field.onChange} />}
              />
            </div>

            {watchedPredefinedAnalytics && <>
              {/* Metrics (admin-only) */}
              <div className="border-t border-[#DFE2ED] pt-4">
                <p className="text-[11px] font-bold text-[#69708A] uppercase tracking-[0.4px] mb-3">Metrics</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Reviews">
                    <input type="number" min="0" {...register("reviewCount")} className={inputCls} placeholder="e.g. 312" />
                  </Field>
                  <Field label="Enrolled">
                    <input type="number" min="0" {...register("enrolledCount")} className={inputCls} placeholder="e.g. 2100" />
                  </Field>
                  <Field label="Countries">
                    <input type="number" min="0" {...register("countriesCount")} className={inputCls} placeholder="e.g. 120" />
                  </Field>
                </div>
              </div>

              {/* Social Proof (admin-only) */}
              <div className="border-t border-[#DFE2ED] pt-4">
                <p className="text-[11px] font-bold text-[#69708A] uppercase tracking-[0.4px] mb-3">Social Proof</p>
                <Field label="Rating">
                  <Controller
                    name="rating"
                    control={control}
                    render={({ field }) => <StarRating value={field.value ?? ""} onChange={field.onChange} />}
                  />
                  <FieldError msg={errors.rating?.message} />
                </Field>
              </div>
            </>}
          </>}

          {/* Step 2 — Objectives */}
          {step === 2 && <>
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
            <Field label="Learning Objectives" required>
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <FieldError msg={(errors.learningObjectives as any)?.message} />
            </Field>
            <Field label="Target Audience" required>
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <FieldError msg={(errors.targetAudience as any)?.message} />
            </Field>
            <Field label="Highlights" required>
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <FieldError msg={(errors.whatIsIncluded as any)?.message} />
            </Field>
          </>}

          {/* Step 3 — Curriculum */}
          {step === 3 && <>
            <p className="text-[13px] text-[#69708A] leading-relaxed">
              Build the programme outline. Each module appears as an accordion on the public page.
            </p>
            <Field label="Outline introduction" hint="Shown under “Programme Outline” on the public page. Leave empty to use a default sentence based on the number of modules.">
              <textarea
                {...register("outlineIntro")}
                rows={3}
                className={inputCls}
                placeholder="e.g. The programme runs over 7 modules. Each combines short videos, worked examples and a practical assignment…"
              />
              <FieldError msg={errors.outlineIntro?.message} />
            </Field>
            <CurriculumEditor control={control} register={register} errors={errors} />
          </>}

          {/* Step 4 — Grading */}
          {step === 4 && <>
            <p className="text-[13px] text-[#69708A] leading-relaxed">
              How this programme is marked. Leave grading off for a programme that is read-only or
              certificate-on-completion; the settings below then have no effect.
            </p>

            <label className="flex items-start gap-3 rounded-[10px] border border-[#DFE2ED] bg-[#FAFAFF] px-3.5 py-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("gradingEnabled")}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#6655DF] cursor-pointer"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-bold text-[#171C35]">Grade this programme</span>
                <span className="block text-[12px] text-[#69708A] mt-0.5">
                  Computes an overall mark from coursework and the final project, and decides who passes.
                </span>
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Coursework weight (%)" hint="Chapter quizzes plus module assignments (when they count — see the Assessments tab)">
                <input type="number" min={0} max={100} {...register("quizWeight")} className={inputCls} />
                <FieldError msg={errors.quizWeight?.message} />
              </Field>
              <Field label="Final project weight (%)" hint="Must add up to 100 with the coursework weight">
                <input type="number" min={0} max={100} {...register("projectWeight")} className={inputCls} />
                <FieldError msg={errors.projectWeight?.message} />
              </Field>
              <Field label="Pass mark" hint="Overall marks needed to pass, out of 100">
                <input type="number" min={0} max={100} {...register("passMark")} className={inputCls} />
                <FieldError msg={errors.passMark?.message} />
              </Field>
              <Field label="Component pass mark (%)" hint="Minimum needed within each component on its own">
                <input type="number" min={0} max={100} {...register("componentPassMark")} className={inputCls} />
                <FieldError msg={errors.componentPassMark?.message} />
              </Field>
              <Field label="Quiz attempts" hint="0 for unlimited">
                <input type="number" min={0} max={20} {...register("maxQuizAttempts")} className={inputCls} />
                <FieldError msg={errors.maxQuizAttempts?.message} />
              </Field>
              <Field label="Cooldown between attempts (hours)" hint="0 for no waiting period">
                <input type="number" min={0} max={168} {...register("attemptCooldownHours")} className={inputCls} />
                <FieldError msg={errors.attemptCooldownHours?.message} />
              </Field>
              <Field label="Project resubmissions" hint="0 means one submission only">
                <input type="number" min={0} max={20} {...register("maxProjectResubmissions")} className={inputCls} />
                <FieldError msg={errors.maxProjectResubmissions?.message} />
              </Field>
            </div>

          </>}

          {/* Step 5 — Facilitators */}
          {step === 5 && (
            <Controller
              name="facilitators"
              control={control}
              render={({ field }) => (
                <FacilitatorPicker value={field.value ?? []} onChange={field.onChange} />
              )}
            />
          )}

          {/* Step 6 — FAQs */}
          {step === 6 && <>
            <div className="flex items-start justify-between gap-4">
              <p className="text-[13px] text-[#69708A] leading-relaxed">
                Add frequently asked questions shown in an accordion on the programme page. At least one FAQ is required.
              </p>
              <span className="shrink-0 pt-0.5">
                <RegenerateFaqsButton
                  context={{
                    title:    watchedTitle ?? "",
                    excerpt:  watch("excerpt"),
                    overview: watch("overview"),
                    level:    watch("level"),
                    format:   watch("format"),
                    duration: watch("duration"),
                    price:    watch("pricing") === "free" ? "Free" : watch("price"),
                    audience:   (watch("targetAudience") ?? []).filter(Boolean),
                    objectives: (watch("learningObjectives") ?? []).filter(Boolean),
                  }}
                  existing={watch("faqs") ?? []}
                  onGenerated={faqs => setValue("faqs", faqs, { shouldValidate: true, shouldDirty: true })}
                />
              </span>
            </div>
            <FaqEditor control={control} register={register} errors={errors} courseTitle={watchedTitle || "this programme"} />
          </>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#DFE2ED] bg-[#FAFAFF] shrink-0">
          <span className="text-[12px] text-[#8A90A6] font-medium">
            Step <span className="text-[#171C35] font-bold">{step}</span> of {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={step === 1 ? onClose : handleBack}
              className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={saving}
                className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving…" : program ? "Save Changes" : aiGenerated ? "Save as Draft" : "Create Program"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer"
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

// ── AI Course Builder modal ───────────────────────────────────────────────────

export function AiCourseBuilderModal({
  categories, onGenerated, onClose,
}: {
  categories:  Category[]
  onGenerated: (draft: Partial<ProgramFormValues>) => void
  onClose:     () => void
}) {
  const [topic, setTopic]           = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [level, setLevel]           = useState<CourseLevel>("BEGINNER")
  const [notes, setNotes]           = useState("")
  const [aiWeeks, setAiWeeks]       = useState("")
  const parsedAiWeeks = Number(aiWeeks)
  /** Blank lets the AI choose; otherwise the outline is sized to fit. */
  const aiWeeksNumber = Number.isInteger(parsedAiWeeks) && parsedAiWeeks >= 1 && parsedAiWeeks <= MAX_DURATION_WEEKS ? parsedAiWeeks : undefined
  const [provider, setProvider]     = useState<"anthropic" | "openai">("anthropic")
  const [withCover, setWithCover]   = useState(true)
  const [withHandouts, setWithHandouts] = useState(true)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState("")
  const [progress, setProgress]     = useState<Progress | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim() || !categoryId) return
    setLoading(true)
    setError("")
    setProgress(null)
    try {
      const { outline, chapters, thumbnail } = await buildCourse(
        {
          topic: topic.trim(), categoryId, level,
          notes: notes.trim() || undefined, provider,
          durationWeeks: aiWeeksNumber,
          withCoverImage: withCover,
          withHandouts:   withHandouts,
        },
        setProgress,
      )

      onGenerated({
        title:              outline.title,
        excerpt:            outline.excerpt,
        tagline:            outline.tagline,
        overview:           outline.overview,
        learningObjectives: outline.learningObjectives,
        targetAudience:     outline.targetAudience,
        whatIsIncluded:     outline.whatIsIncluded,
        faqs:               outline.faqs,
        categoryId:         outline.categoryId,
        level:              outline.level as CourseLevel,
        durationWeeks:      String(outline.durationWeeks),
        hoursPerWeek:       outline.hoursPerWeek ?? "",
        duration:           formatDuration(outline.durationWeeks, outline.hoursPerWeek),
        // Satisfies the form's required cover image when one was generated;
        // the admin can still replace it in review.
        ...(thumbnail ? { thumbnail } : {}),
        curriculum: chapters.map(chapter => ({
          id:    chapter.id,
          title: chapter.title,
          desc:  chapter.desc,
          lessons: chapter.lessons.map(lesson => ({
            id:           lesson.id,
            title:        lesson.title,
            description:  lesson.description,
            blocks:       lesson.blocks ?? [],
            // The generator doesn't estimate runtimes, so leave it unset and
            // let lib/lesson-duration.ts derive one from the content.
            estimatedMinutes: null,
            focus:        lesson.focus,
            brief:        lesson.brief,
            mustCover:    lesson.mustCover,
            mustNotCover: lesson.mustNotCover,
          })),
        })),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#171C35]/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-white font-extrabold text-[16px]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z"/></svg>
              AI Program Builder
            </div>
            <p className="text-[12px] text-white/80 mt-0.5">Generate a draft using our programme structure — you review before publishing.</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white shrink-0 bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {loading ? (
            <div className="py-6 flex flex-col items-center text-center gap-3">
              <div className="w-8 h-8 border-2 border-[#6655DF]/25 border-t-[#6655DF] rounded-full animate-spin" />
              <p className="text-[13px] font-medium text-[#171C35] min-h-[18px]">{progress?.message ?? "Starting…"}</p>
              {/* Ticks rather than a smooth fill: the work really is discrete
                  — one tick per lesson written — so a continuous bar would
                  imply progress between lessons that doesn't exist. */}
              {progress?.total ? (
                <TickProgress
                  value={((progress.done ?? 0) / progress.total) * 100}
                  ticks={Math.min(progress.total, 36)}
                  label={`${progress.done ?? 0} of ${progress.total} lessons written`}
                  className="w-full max-w-[260px]"
                />
              ) : null}
            </div>
          ) : (
            <>
              <Field label="AI Model">
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["anthropic", "Anthropic Claude"],
                    ["openai",    "GPT-4.1 mini"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setProvider(value)}
                      className={`px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${
                        provider === value
                          ? "bg-[#6655DF] border-[#6655DF] text-white"
                          : "bg-white border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Course Topic" required hint="what should this programme teach?">
                <textarea
                  autoFocus
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  rows={3}
                  className={inputCls}
                  placeholder="e.g. Monitoring and Evaluation (M&E) fundamentals for public sector analysts"
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category" required>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputCls} required>
                    {categories.length === 0 && <option value="">— No categories —</option>}
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Level">
                  <select value={level} onChange={e => setLevel(e.target.value as CourseLevel)} className={inputCls}>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </Field>
              </div>
              <Field label="Duration (weeks)" hint="optional — leave blank and the AI suggests one">
                <input
                  type="number" min={1} max={MAX_DURATION_WEEKS} step={1} inputMode="numeric"
                  value={aiWeeks}
                  onChange={e => setAiWeeks(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 7"
                />
              </Field>
              <Field label="Notes" hint="optional">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className={inputCls}
                  placeholder="e.g. focus on results-based frameworks, keep it self-paced"
                />
              </Field>
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-[#171C35]">Generate a cover image</p>
                  <p className="text-[11.5px] text-[#8A90A6] mt-0.5">
                    A cover is required before the programme can be saved — you can replace it in review.
                  </p>
                </div>
                <Toggle label="" checked={withCover} onChange={setWithCover} />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-[#171C35]">Build chapter handouts</p>
                  <p className="text-[11.5px] text-[#8A90A6] mt-0.5">
                    Renders each chapter&apos;s lesson text to a downloadable PDF resource.
                  </p>
                </div>
                <Toggle label="" checked={withHandouts} onChange={setWithHandouts} />
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading || !topic.trim() || !categoryId} className="flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer">
              {loading ? "Generating…" : "Generate Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Category · Level · Programme type ────────────────────────────────────────

export const PRICING_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
]

export const PAYMENT_TYPE_OPTIONS = [
  { value: "one-time",     label: "One-time payment" },
  { value: "subscription", label: "Subscription / Membership" },
  { value: "monthly",      label: "Monthly Payment Plan" },
]

export const LEVEL_OPTIONS = [
  { value: "BEGINNER",     label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED",     label: "Advanced" },
]

/** The programme's classification on one row, each a searchable select.
 *  Programme type sets both `programFormatId` (the Formats lookup) and the
 *  `format` name the public page and the date fields key off. */
export function ClassificationRow({ control, setValue, errors, categories, formats, children }: {
  control:    Control<ProgramFormValues>
  setValue:   (name: "format" | "programFormatId", value: string, opts?: { shouldDirty?: boolean; shouldValidate?: boolean }) => void
  errors:     FieldErrors<ProgramFormValues>
  categories: Category[]
  formats:    Lookup[]
  /** Rendered after Programme type, sharing its row (the Pricing field). */
  children?:  React.ReactNode
}) {
  const format = useWatch({ control, name: "format" })
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Category" required>
        <Controller
          control={control} name="categoryId"
          render={({ field }) => (
            <SearchableSelect
              label="Category" placeholder="— Select —" searchPlaceholder="Search categories"
              emptyMessage="No categories yet — add one in the Categories tab."
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              value={field.value ?? ""} onChange={field.onChange}
              invalid={!!errors.categoryId}
            />
          )}
        />
        <FieldError msg={errors.categoryId?.message} />
      </Field>
      <Field label="Level" required>
        <Controller
          control={control} name="level"
          render={({ field }) => (
            <SearchableSelect
              label="Level" searchPlaceholder="Search levels"
              options={LEVEL_OPTIONS}
              value={field.value ?? ""} onChange={field.onChange}
              invalid={!!errors.level}
            />
          )}
        />
        <FieldError msg={errors.level?.message} />
      </Field>
      <Field label="Programme type">
        <Controller
          control={control} name="programFormatId"
          render={({ field }) => {
            // Older programmes carry only the name; match it to a lookup row.
            const current = field.value || formats.find(f => f.name === format)?.id || ""
            return (
              <SearchableSelect
                label="Programme type" placeholder="— Select —" searchPlaceholder="Search types"
                emptyMessage="No programme types yet."
                options={formats.map(f => ({ value: f.id, label: f.name }))}
                value={current}
                onChange={id => {
                  field.onChange(id)
                  setValue("format", formats.find(f => f.id === id)?.name ?? "", { shouldDirty: true, shouldValidate: true })
                }}
              />
            )
          }}
        />
      </Field>
      {children}
    </div>
  )
}
