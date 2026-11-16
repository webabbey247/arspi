"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { X } from "lucide-react"
import { studentPreviewHref } from "@/lib/program-preview-links"

/**
 * The assigned instructor hands a programme back to the admins for approval.
 * Admins get an in-app alert and an email; publishing stays with them.
 */
export default function SubmitForApprovalDialog({
  program, onClose, onDone,
}: {
  program: { id: string; title: string; slug: string; submittedForReviewAt?: string | null }
  onClose: () => void
  onDone: () => void
}) {
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const again = !!program.submittedForReviewAt

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  async function submit() {
    setBusy(true)
    const res = await fetch(`/api/instructor/programs/${program.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note.trim() || undefined }),
    })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return toast.error(d.error ?? "Could not submit the programme.")
    toast.success("Submitted. The administrators have been notified.")
    onDone()
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#171C35]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="submit-title">
      <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] px-5 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="submit-title" className="text-[16px] font-extrabold text-white">{again ? "Resubmit for approval" : "Submit for approval"}</h2>
            <p className="text-[12px] text-white/75 mt-0.5 truncate">{program.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-3">
          <p className="text-[13.5px] text-[#69708A]">
            {again
              ? "It's already waiting for approval. Resubmitting tells the administrators you've made further changes."
              : "The administrators will be notified to review and approve it. You can keep editing until it's approved."}
          </p>
          <a href={studentPreviewHref("INSTRUCTOR", program.slug)} className="inline-block text-[13px] font-bold text-[#6655DF] hover:underline">
            Preview it as a student first
          </a>
          <div>
            <label htmlFor="submit-note" className="block text-[11px] font-bold text-[#69708A] uppercase tracking-[0.4px] mb-1">
              Note for the administrators <span className="normal-case tracking-normal font-normal">(optional)</span>
            </label>
            <textarea
              id="submit-note" rows={4} maxLength={2000} value={note} onChange={e => setNote(e.target.value)}
              placeholder="What changed, or anything they should check."
              className="w-full px-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] outline-none focus:border-[#6655DF] resize-y"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#DFE2ED] bg-[#FAFAFF]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-white cursor-pointer">Cancel</button>
          <button type="button" onClick={submit} disabled={busy} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer">
            {busy ? "Submitting…" : again ? "Resubmit" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  )
}
