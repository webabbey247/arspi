"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { FacilitatorPhotoUpload } from "./FacilitatorAvatar"
import type { DirectoryFacilitator } from "./types"

// The rich-text editor is heavy; load it with the form, not the page.
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
  ssr: false,
  loading: () => <div className="h-[180px] rounded-[10px] border border-[#DFE2ED] bg-[#FAFAFF] animate-pulse" />,
})

const inputCls = "w-full px-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"

function Field({ label, hint, required, error, children }: {
  label: string; hint?: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-[#171C35] mb-1.5">
        {label}{required && <span className="text-rose-500"> *</span>}
        {hint && <span className="font-normal text-[#8A90A6]"> — {hint}</span>}
      </label>
      {children}
      {error && <p className="text-[12px] text-rose-600 mt-1">{error}</p>}
    </div>
  )
}

const isBlankHtml = (html: string) => !html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()

/**
 * Create or edit a facilitator directory entry. Used by the Facilitators tab
 * (create + edit) and the programme editor's picker (create). On success it
 * hands back the saved entry.
 */
export default function FacilitatorFormModal({ facilitator, initialName, onSaved, onClose }: {
  /** Edit this entry; omit to create. */
  facilitator?: DirectoryFacilitator | null
  /** Prefill the name when creating (e.g. from the picker's search). */
  initialName?: string
  onSaved: (f: DirectoryFacilitator, programmesUpdated?: number) => void
  onClose: () => void
}) {
  const editing = !!facilitator
  const [name, setName]               = useState(facilitator?.name ?? initialName ?? "")
  const [title, setTitle]             = useState(facilitator?.title ?? "")
  const [bio, setBio]                 = useState(facilitator?.bio ?? "")
  const [imageUrl, setImageUrl]       = useState(facilitator?.imageUrl ?? "")
  const [credentials, setCredentials] = useState(facilitator?.credentials ?? "")
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [saving, setSaving]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim())     next.name  = "Full name is required"
    if (!title.trim())    next.title = "Title / role is required"
    if (isBlankHtml(bio)) next.bio   = "Biography is required"
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    setServerError("")
    try {
      const res = await fetch(editing ? `/api/facilitators/${facilitator!.id}` : "/api/facilitators", {
        method:  editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name, title, bio,
          imageUrl:    imageUrl || null,
          credentials: credentials.trim() || null,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setServerError(d.error ?? "Could not save the facilitator."); return }
      onSaved({ ...d.facilitator, programmes: d.facilitator.programmes ?? facilitator?.programmes ?? 0 }, d.programmesUpdated)
    } catch {
      setServerError("Could not save the facilitator. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogPrimitive.Root open onOpenChange={o => { if (!o && !saving) onClose() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[260] bg-[#171C35]/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed z-[270] inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-2xl max-h-[94vh] bg-white sm:rounded-[18px] rounded-t-[18px] shadow-2xl flex flex-col overflow-hidden outline-none"
        >
          <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] px-6 py-5 flex items-start justify-between gap-4 shrink-0">
            <div>
              <DialogPrimitive.Title className="text-[17px] font-extrabold text-white">
                {editing ? "Edit facilitator" : "Add facilitator"}
              </DialogPrimitive.Title>
              <p className="text-[12px] text-white/80 mt-0.5">
                {editing
                  ? facilitator!.programmes > 0
                    ? `Changes appear on all ${facilitator!.programmes} programme${facilitator!.programmes === 1 ? "" : "s"} that list them.`
                    : "Not on any programme yet."
                  : "Saved to the facilitator directory, ready to add to any programme."}
              </p>
            </div>
            <DialogPrimitive.Close asChild>
              <button type="button" disabled={saving} aria-label="Close" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center shrink-0 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {serverError && <p className="text-[12px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{serverError}</p>}

              <Field label="Photo" hint="optional">
                <FacilitatorPhotoUpload value={imageUrl} name={name} onChange={setImageUrl} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full name" required error={errors.name}>
                  <input autoFocus value={name} onChange={e => setName(e.target.value)} maxLength={120} className={inputCls} placeholder="e.g. Dr. Rachel Osei" />
                </Field>
                <Field label="Title / role" required error={errors.title}>
                  <input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} className={inputCls} placeholder="e.g. Director, Applied Research Methods" />
                </Field>
              </div>
              <Field label="Biography" required error={errors.bio}>
                <RichTextEditor value={bio} onChange={setBio} placeholder="Background, expertise and experience…" minHeight={180} />
              </Field>
              <Field label="Credentials" hint="optional — one per line">
                <textarea value={credentials} onChange={e => setCredentials(e.target.value)} rows={3} maxLength={1000} className={`${inputCls} resize-none`} placeholder={"e.g. PhD Research Methods\n15+ Years Research Practice"} />
              </Field>
            </div>

            <div className="px-6 py-4 border-t border-[#F0EFFA] flex justify-end gap-2 shrink-0">
              <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:text-[#171C35] cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-[10px] text-[13px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-60 cursor-pointer">
                {saving ? "Saving…" : editing ? "Save changes" : "Add facilitator"}
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
