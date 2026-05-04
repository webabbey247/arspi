"use client"

import { useRef, useState } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { ChevronRight, Loader2, X, Upload, FileText, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import * as yup from "yup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUploadThing } from "@/lib/uploadthing-client"

const SOURCES = [
  "Search engine",
  "LinkedIn",
  "Twitter / X",
  "Friend or colleague",
  "ARPS website",
  "Newsletter",
  "Conference / event",
  "Other",
] as const

const schema = yup.object({
  fullName:       yup.string().trim().min(2, "At least 2 characters").max(255).required("Required"),
  email:          yup.string().trim().email("Invalid email").required("Required").lowercase(),
  mobile:         yup.string().trim().min(5, "Too short").max(40, "Too long").required("Required"),
  country:        yup.string().trim().min(2, "Required").max(120).required("Required"),
  resumeUrl:      yup.string().url("Upload a resume").required("Resume is required"),
  coverLetterUrl: yup.string().url().nullable().default(null),
  linkedinUrl:    yup.string().trim().url("Must be a valid URL").nullable().default(null),
  source:         yup.string().nullable().default(null),
})

type FormInput = yup.InferType<typeof schema>

type Props = {
  career: {
    slug:  string
    title: string
  }
  setModalOpen: (open: boolean) => void
}

// ── Inline file uploader ────────────────────────────────────────────────────

function FileField({
  label,
  value,
  onChange,
  required,
  accept,
}: {
  label:    string
  value:    string
  onChange: (url: string) => void
  required?: boolean
  accept?:  string
}) {
  const [uploading, setUploading] = useState(false)
  const { startUpload } = useUploadThing("documentUploader")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await startUpload([file])
      if (res?.[0]?.url) {
        onChange(res[0].url)
      } else {
        toast.error("Upload failed. Please try again.")
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {value ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border border-emerald-400/40 rounded bg-emerald-50">
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-body text-[0.8125rem] text-emerald-700 hover:underline truncate"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            View uploaded file
          </a>
          <button
            type="button"
            onClick={() => onChange("")}
            className="font-body text-[0.6875rem] uppercase tracking-[0.05em] text-slate-500 hover:text-red-500 cursor-pointer"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-[#0474C4]/30 rounded font-body text-[0.8125rem] text-slate-500 hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 cursor-pointer transition-colors"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading…" : `Upload ${label.toLowerCase()}`}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? "application/pdf,.doc,.docx"}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

// ── Form modal ──────────────────────────────────────────────────────────────

export default function CareerApplicationForm({ career, setModalOpen }: Props) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: yupResolver(schema) as Resolver<FormInput>,
    defaultValues: {
      fullName: "", email: "", mobile: "", country: "",
      resumeUrl: "", coverLetterUrl: null, linkedinUrl: null, source: null,
    },
  })

  function close() {
    setModalOpen(false)
  }

  async function onSubmit(data: FormInput) {
    try {
      const res = await fetch(`/api/careers/${career.slug}/applications`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "Something went wrong.")
        return
      }
      toast.success("Application submitted!")
      setSubmitted(true)
    } catch {
      toast.error("Network error. Please try again.")
    }
  }

  return (
    <div
      className="fixed inset-0 bg-[#181C2C]/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={close}
    >
      <div
        className="bg-white rounded-lg w-full max-w-xl shadow-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0474C4] px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-white/65 mb-1">
              Apply
            </p>
            <h2 className="font-heading text-[1.125rem] tracking-[-0.005em] leading-tight font-semibold text-white">
              {career.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
            <p className="font-heading text-[1.125rem] font-semibold text-ink mb-1">Application received</p>
            <p className="font-body text-[0.875rem] text-slate-600 mb-5">
              Thanks for applying. We&apos;ll be in touch if there&apos;s a fit.
            </p>
            <Button
              type="button"
              onClick={close}
              className="h-10 rounded px-5 font-body text-[0.8125rem] font-medium bg-[#0474C4] text-white hover:bg-[#06457f]"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">

            <div>
              <label className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 mb-1 block">
                Full name<span className="text-red-500 ml-0.5">*</span>
              </label>
              <Input {...register("fullName")} placeholder="Jane Doe" className="font-body text-[0.875rem]" />
              {errors.fullName && <p className="font-body text-[0.6875rem] text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 mb-1 block">
                  Email<span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input type="email" {...register("email")} placeholder="you@example.com" className="font-body text-[0.875rem]" />
                {errors.email && <p className="font-body text-[0.6875rem] text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 mb-1 block">
                  Mobile number<span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input {...register("mobile")} placeholder="+254 700 000000" className="font-body text-[0.875rem]" />
                {errors.mobile && <p className="font-body text-[0.6875rem] text-red-500 mt-1">{errors.mobile.message}</p>}
              </div>
            </div>

            <div>
              <label className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 mb-1 block">
                Country<span className="text-red-500 ml-0.5">*</span>
              </label>
              <Input {...register("country")} placeholder="Kenya" className="font-body text-[0.875rem]" />
              {errors.country && <p className="font-body text-[0.6875rem] text-red-500 mt-1">{errors.country.message}</p>}
            </div>

            <Controller
              name="resumeUrl"
              control={control}
              render={({ field }) => (
                <>
                  <FileField
                    label="Resume"
                    required
                    value={field.value ?? ""}
                    onChange={(url) => field.onChange(url || "")}
                  />
                  {errors.resumeUrl && <p className="font-body text-[0.6875rem] text-red-500 mt-1">{errors.resumeUrl.message}</p>}
                </>
              )}
            />

            <Controller
              name="coverLetterUrl"
              control={control}
              render={({ field }) => (
                <FileField
                  label="Cover letter"
                  value={field.value ?? ""}
                  onChange={(url) => field.onChange(url || null)}
                />
              )}
            />

            <div>
              <label className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 mb-1 block">
                LinkedIn URL
              </label>
              <Input {...register("linkedinUrl")} placeholder="https://linkedin.com/in/…" className="font-body text-[0.875rem]" />
              {errors.linkedinUrl && <p className="font-body text-[0.6875rem] text-red-500 mt-1">{errors.linkedinUrl.message}</p>}
            </div>

            <div>
              <label className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 mb-1 block">
                How did you hear about us?
              </label>
              <select
                {...register("source")}
                className="h-12 w-full px-2.5 py-1 text-[0.875rem] border border-input rounded-lg bg-transparent outline-none focus:border-[#0474C4]"
              >
                <option value="">— Select an option —</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={close}
                className="font-body text-[0.75rem] tracking-[0.05em] uppercase font-medium text-slate-500 hover:text-ink px-3 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 rounded py-2.5 px-6 font-body text-[0.875rem] tracking-[0.02em] font-medium bg-[#0474C4] text-white hover:bg-[#06457f]"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  <>Submit application <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
