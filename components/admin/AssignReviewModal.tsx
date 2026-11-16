"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { X, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Instructor = {
  id: string
  email: string
  invitePending: boolean
  profile: { firstName: string | null; lastName: string | null } | null
  _count: { taughtCourses: number }
}

const nameOf = (u: Instructor) =>
  [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") || u.email

/**
 * "Assign for review": pick the instructor who will review, edit and grade a
 * programme. Assigning hands it over completely — it moves into their "My
 * Programs", their grading queues, and they're notified in-app and by email.
 */
export default function AssignReviewModal({
  program, onClose, onDone,
}: {
  /** `instructorId` is null for a programme that hasn't been assigned yet. */
  program: { id: string; title: string; instructorId: string | null }
  onClose: () => void
  onDone: () => void
}) {
  const [list, setList]       = useState<Instructor[] | null>(null)
  const [query, setQuery]     = useState("")
  const [picked, setPicked]   = useState<string>(program.instructorId ?? "")
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    let live = true
    fetch("/api/admin/users?role=INSTRUCTOR&status=ACTIVE")
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (live) setList(Array.isArray(d) ? d : []) })
      .catch(() => live && setList([]))
    return () => { live = false }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (list ?? []).filter(u => !q || nameOf(u).toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [list, query])

  const changed = !!picked && picked !== program.instructorId

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/programs/${program.id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructorId: picked }),
    })
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return toast.error(d.error ?? "Could not assign the programme.")
    toast.success(`Assigned to ${d.instructorName}. They've been notified.`)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#171C35]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="assign-title">
      <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] px-5 py-4 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 id="assign-title" className="text-[16px] font-extrabold text-white">
              {program.instructorId ? "Reassign programme" : "Assign for review"}
            </h2>
            <p className="text-[12px] text-white/75 mt-0.5 truncate">{program.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2 shrink-0">
          <p className="text-[13px] text-[#69708A] mb-3">
            The instructor reviews and edits the programme, submits it for your approval, and grades its learners.
          </p>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" />
            <input
              value={query} onChange={e => setQuery(e.target.value)} autoFocus
              placeholder="Search instructors…" aria-label="Search instructors"
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] outline-none focus:border-[#6655DF]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {list === null ? (
            <div className="space-y-2 pt-2">{[0, 1, 2].map(i => <div key={i} className="h-14 rounded-[12px] bg-[#F5F6FB] animate-pulse" />)}</div>
          ) : list.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[14px] font-bold text-[#171C35]">No instructors yet.</p>
              <p className="text-[13px] text-[#69708A] mt-1">
                Invite one from <Link href="/administrator/staff" className="font-bold text-[#6655DF] underline">Staff &amp; Roles</Link>.
              </p>
            </div>
          ) : (
            <div role="radiogroup" aria-label="Instructor" className="space-y-1.5 pt-2">
              {shown.map(u => {
                const sel = picked === u.id
                return (
                  <label
                    key={u.id}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] border cursor-pointer transition-colors",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#6655DF]",
                      sel ? "border-[#6655DF] bg-[#F7F6FF]" : "border-[#DFE2ED] hover:bg-[#FAFAFF]",
                    )}
                  >
                    <input type="radio" name="assignee" value={u.id} checked={sel} onChange={() => setPicked(u.id)} className="sr-only" />
                    <span className={cn("w-4 h-4 rounded-full border-2 grid place-items-center shrink-0", sel ? "border-[#6655DF] bg-[#6655DF]" : "border-[#C9CCDD]")}>
                      {sel && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-bold text-[#171C35] truncate">
                        {nameOf(u)}
                        {u.id === program.instructorId && <span className="ml-2 text-[11px] font-bold text-[#6655DF]">current</span>}
                      </span>
                      <span className="block text-[12px] text-[#8A90A6] truncate">
                        {u.email} · {u._count.taughtCourses} programme{u._count.taughtCourses === 1 ? "" : "s"}
                        {u.invitePending && " · invite pending"}
                      </span>
                    </span>
                  </label>
                )
              })}
              {shown.length === 0 && <p className="py-6 text-center text-[13px] text-[#8A90A6]">No instructors match.</p>}
            </div>
          )}
        </div>

        <div className="shrink-0 flex justify-end gap-2 px-5 py-4 border-t border-[#DFE2ED] bg-[#FAFAFF]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-white cursor-pointer">Cancel</button>
          <button
            type="button" onClick={save} disabled={!changed || saving}
            className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? "Saving…" : program.instructorId ? "Reassign" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  )
}
