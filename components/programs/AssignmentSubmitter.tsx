"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { FileText, Upload, X, Check, RotateCcw, Clock } from "lucide-react"
import { useUploadThing } from "@/lib/uploadthing-client"
import { cn } from "@/lib/utils"

type SubmissionFile = { url: string; name: string; size?: number }
type Status = "SUBMITTED" | "RETURNED" | "ACCEPTED"

type Submission = {
  id: string
  text: string | null
  linkUrl: string | null
  files: SubmissionFile[] | null
  status: Status
  feedback: string | null
  points: number | null
  submittedAt: string
  gradedAt: string | null
}

const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"

const STATUS: Record<Status, { label: string; cls: string; icon: React.ReactNode }> = {
  SUBMITTED: { label: "Awaiting review", cls: "bg-sky-50 text-sky-700",         icon: <Clock className="w-3 h-3" /> },
  RETURNED:  { label: "Changes needed",  cls: "bg-amber-50 text-amber-700",     icon: <RotateCcw className="w-3 h-3" /> },
  ACCEPTED:  { label: "Accepted",        cls: "bg-emerald-50 text-emerald-700", icon: <Check className="w-3 h-3" /> },
}

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/**
 * Submission form for an in-lesson assignment.
 *
 * Which control appears is decided by the block's own `submissionType`, and
 * the server re-checks it — the field a student fills in is not something the
 * client gets to choose. A block set to "none" is instructions only and
 * renders no form at all.
 */
export default function AssignmentSubmitter({
  slug, blockId, submissionType, points,
}: {
  slug: string
  blockId: string
  submissionType: "text" | "file" | "link" | "none"
  points?: string
}) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState(false)
  const [busy, setBusy]             = useState(false)

  const [text, setText]   = useState("")
  const [link, setLink]   = useState("")
  const [files, setFiles] = useState<SubmissionFile[]>([])

  const { startUpload, isUploading } = useUploadThing("projectUploader")

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/student/programs/${slug}/assignments/${blockId}`)
      const d   = await res.json()
      if (res.ok && d.submission) {
        setSubmission(d.submission)
        setText(d.submission.text ?? "")
        setLink(d.submission.linkUrl ?? "")
        setFiles(d.submission.files ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [slug, blockId])

  useEffect(() => { if (submissionType !== "none") load() }, [load, submissionType])

  if (submissionType === "none") return null

  async function pick(list: FileList | null) {
    if (!list?.length) return
    const uploaded = await startUpload(Array.from(list))
    if (!uploaded?.length) return toast.error("Upload failed.")
    setFiles(f => [...f, ...uploaded.map(u => ({ url: u.url, name: u.name, size: u.size }))])
  }

  async function submit() {
    setBusy(true)
    const res = await fetch(`/api/student/programs/${slug}/assignments/${blockId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text:    submissionType === "text" ? text : undefined,
        linkUrl: submissionType === "link" ? link : undefined,
        files:   submissionType === "file" ? files : undefined,
      }),
    })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return toast.error(d.error ?? "Could not submit.")
    setSubmission(d.submission)
    setEditing(false)
    toast.success(submission ? "Resubmitted for review." : "Submitted for review.")
  }

  if (loading) {
    return <div className="mt-3 h-10 rounded-[10px] bg-[#F5F6FB] animate-pulse" />
  }

  const locked   = submission?.status === "ACCEPTED"
  const showForm = editing || !submission

  return (
    <div className="mt-4 pt-4 border-t border-[#F0EFFA]">
      {submission && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em]",
            STATUS[submission.status].cls,
          )}>
            {STATUS[submission.status].icon}
            {STATUS[submission.status].label}
          </span>
          <span className={metaCls}>Submitted {fmtWhen(submission.submittedAt)}</span>
          {submission.points != null && points && (
            <span className="text-[12px] font-bold text-[#171C35]">{submission.points} / {points} marks</span>
          )}
        </div>
      )}

      {submission?.feedback && (
        <div className="mb-3 rounded-[10px] bg-[#FAFAFF] border border-[#F0EFFA] px-3 py-2.5">
          <p className={cn(metaCls, "mb-1")}>Reviewer feedback</p>
          <p className="text-[13.5px] text-[#171C35] whitespace-pre-line">{submission.feedback}</p>
        </div>
      )}

      {!showForm ? (
        <div className="space-y-2.5">
          {submission?.text && (
            <p className="text-[13.5px] text-[#171C35] whitespace-pre-line rounded-[10px] bg-[#FAFAFF] border border-[#F0EFFA] px-3 py-2.5">
              {submission.text}
            </p>
          )}
          {submission?.linkUrl && (
            <a href={submission.linkUrl} target="_blank" rel="noopener noreferrer"
               className="inline-block text-[13.5px] font-bold text-[#6655DF] underline underline-offset-2 break-all">
              {submission.linkUrl}
            </a>
          )}
          {(submission?.files ?? []).length > 0 && (
            <ul className="space-y-1.5">
              {(submission?.files ?? []).map((f, i) => (
                <li key={i}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#DFE2ED] bg-[#FAFAFF] text-[13.5px] font-bold text-[#171C35] hover:border-[#6655DF] no-underline">
                    <FileText className="w-3.5 h-3.5 text-[#6655DF]" />
                    {f.name}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {!locked && (
            <button
              type="button" onClick={() => setEditing(true)}
              className="mt-1 px-4 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer transition-colors"
            >
              {submission?.status === "RETURNED" ? "Revise and resubmit" : "Edit submission"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {submissionType === "text" && (
            <textarea
              value={text} onChange={e => setText(e.target.value)} rows={5}
              placeholder="Write your response…"
              className="w-full px-3 py-2 text-[14px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none focus:border-[#6655DF] resize-y"
            />
          )}

          {submissionType === "link" && (
            <input
              value={link} onChange={e => setLink(e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 text-[14px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none focus:border-[#6655DF]"
            />
          )}

          {submissionType === "file" && (
            <>
              <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-[12px] border border-dashed border-[#C9CCDD] hover:border-[#6655DF] cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-[#6655DF]" />
                <span className="text-[14px] font-bold text-[#6655DF]">
                  {isUploading ? "Uploading…" : "Choose files"}
                </span>
                <input type="file" multiple className="hidden" disabled={isUploading} onChange={e => pick(e.target.files)} />
              </label>
              {files.length > 0 && (
                <ul className="space-y-1.5">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] border border-[#DFE2ED] bg-[#FAFAFF]">
                      <FileText className="w-3.5 h-3.5 text-[#6655DF] shrink-0" />
                      <span className="flex-1 min-w-0 text-[13.5px] font-bold text-[#171C35] truncate">{f.name}</span>
                      <button
                        type="button" onClick={() => setFiles(x => x.filter((_, j) => j !== i))}
                        aria-label={`Remove ${f.name}`}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button" onClick={submit} disabled={busy || isUploading}
              className="px-5 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy ? "Submitting…" : submission ? "Resubmit" : "Submit"}
            </button>
            {submission && (
              <button
                type="button" onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
