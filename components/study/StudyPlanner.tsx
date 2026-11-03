"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  CalendarPlus, CalendarDays, Clock, Plus, Trash2, Check, RefreshCw,
  Download, AlertTriangle, CalendarCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fmtMins } from "@/lib/lesson-duration"
import { Skeleton } from "@/components/ui/skeleton"

type Slot = { weekday: number; start: string; end: string }
type SessionStatus = "PLANNED" | "DONE" | "MISSED" | "SKIPPED"

type Session = {
  id: string; date: string; startMinute: number; endMinute: number
  lessonIds: string[]; lessonTitles: string[]
  chapterTitle: string | null; estimatedMinutes: number; status: SessionStatus
}

type Plan = {
  id: string; availability: Slot[]; timezone: string
  startDate: string; targetEndDate: string | null; weeklyMinutes: number
}

type Board = {
  plan: Plan | null
  sessions: Session[]
  remaining: { lessons: number; minutes: number }
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"
const inputCls = "px-3 py-2 text-[14px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none focus:border-[#6655DF] transition-colors"

function hhmm(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  })
}

/** Local zone, used as the default so slot times mean what the student expects
 *  without asking them to pick a timezone from a list. */
function localZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" } catch { return "UTC" }
}

// ── Availability editor ──────────────────────────────────────────────────────

function SlotEditor({
  slug, existing, remainingMinutes, onSaved, onCancel,
}: {
  slug: string
  existing: Plan | null
  remainingMinutes: number
  onSaved: () => void
  onCancel: () => void
}) {
  const [slots, setSlots] = useState<Slot[]>(
    existing?.availability ?? [{ weekday: 1, start: "19:00", end: "21:00" }],
  )
  const [deadline, setDeadline] = useState(existing?.targetEndDate?.slice(0, 10) ?? "")
  const [saving, setSaving]     = useState(false)

  const weekly = slots.reduce((sum, s) => {
    const [sh, sm] = s.start.split(":").map(Number)
    const [eh, em] = s.end.split(":").map(Number)
    return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
  }, 0)

  const weeksNeeded = weekly > 0 ? Math.ceil(remainingMinutes / weekly) : null

  async function save() {
    if (slots.length === 0) return toast.error("Add at least one study slot.")
    if (weekly <= 0) return toast.error("Each slot needs an end time after its start.")

    setSaving(true)
    const res = await fetch(`/api/student/programs/${slug}/study-plan`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        availability: slots,
        timezone: localZone(),
        targetEndDate: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : null,
      }),
    })
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return toast.error(d.error ?? "Could not save your plan.")

    if (d.unscheduled > 0) {
      toast.warning(`${d.created} sessions planned, but ${d.unscheduled} lessons wouldn't fit — add more study time.`)
    } else {
      toast.success(
        d.finishesOn
          ? `Planned — you'd finish around ${fmtDay(d.finishesOn)}.`
          : `${d.created} sessions planned.`,
      )
    }
    onSaved()
  }

  return (
    <div className="rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EFFA]">
        <h3 className="text-[14px] font-bold text-[#171C35]">When can you study?</h3>
        <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">
          Lessons are packed into these slots in order, never split across two.
        </p>
      </div>

      <div className="px-5 py-4 space-y-2.5">
        {slots.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              value={s.weekday}
              onChange={e => setSlots(x => x.map((v, j) => (j === i ? { ...v, weekday: Number(e.target.value) } : v)))}
              className={cn(inputCls, "w-28")}
            >
              {DAYS.map((d, wd) => <option key={wd} value={wd}>{d}</option>)}
            </select>
            <input
              type="time" value={s.start}
              onChange={e => setSlots(x => x.map((v, j) => (j === i ? { ...v, start: e.target.value } : v)))}
              className={cn(inputCls, "w-32")}
            />
            <span className="text-[#8A90A6] font-bold">→</span>
            <input
              type="time" value={s.end}
              onChange={e => setSlots(x => x.map((v, j) => (j === i ? { ...v, end: e.target.value } : v)))}
              className={cn(inputCls, "w-32")}
            />
            {slots.length > 1 && (
              <button
                type="button" onClick={() => setSlots(x => x.filter((_, j) => j !== i))}
                aria-label="Remove slot"
                className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setSlots(x => [...x, { weekday: (x.at(-1)?.weekday ?? 0) + 1 > 6 ? 0 : (x.at(-1)?.weekday ?? 0) + 1, start: "19:00", end: "21:00" }])}
          className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#6655DF] hover:text-[#2C2368] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add a slot
        </button>

        <div className="pt-2">
          <label className={cn(metaCls, "block mb-1.5")}>
            Finish by <span className="normal-case tracking-normal font-normal text-[#8A90A6]">(optional)</span>
          </label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={cn(inputCls, "w-48")} />
        </div>

        <div className="rounded-[12px] bg-[#FAFAFF] border border-[#F0EFFA] px-4 py-3 mt-2">
          <p className="text-[13.5px] font-bold text-[#171C35]">
            {fmtMins(weekly)} a week · {fmtMins(remainingMinutes)} of material left
          </p>
          <p className="text-[12px] text-[#8A90A6] mt-1">
            {weeksNeeded !== null
              ? `About ${weeksNeeded} week${weeksNeeded === 1 ? "" : "s"} at this pace. Times are estimated from each lesson's content.`
              : "Add some study time to see how long it would take."}
          </p>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-[#F0EFFA] bg-[#FAFAFF] flex justify-end gap-2">
        {existing && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:bg-white cursor-pointer">
            Cancel
          </button>
        )}
        <button
          type="button" onClick={save} disabled={saving}
          className="px-5 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Planning…" : existing ? "Save & re-plan" : "Create my timetable"}
        </button>
      </div>
    </div>
  )
}

// ── Planner ──────────────────────────────────────────────────────────────────

export default function StudyPlanner({ slug }: { slug: string }) {
  const [board, setBoard]   = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/student/programs/${slug}/study-plan`)
      const d   = await res.json()
      if (res.ok) setBoard(d)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function setStatus(s: Session, status: SessionStatus) {
    const res = await fetch(`/api/student/study-sessions/${s.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    })
    if (!res.ok) return toast.error("Could not update that session.")
    setBoard(b => b ? { ...b, sessions: b.sessions.map(x => (x.id === s.id ? { ...x, status } : x)) } : b)
  }

  async function replan() {
    setBusy(true)
    const res = await fetch(`/api/student/programs/${slug}/study-plan`, { method: "POST" })
    const d   = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return toast.error(d.error ?? "Could not re-plan.")
    toast.success(d.finishesOn ? `Re-planned — finishing around ${fmtDay(d.finishesOn)}.` : "Re-planned.")
    load()
  }

  async function remove() {
    if (!window.confirm("Delete this timetable? Your lesson progress is untouched.")) return
    const res = await fetch(`/api/student/programs/${slug}/study-plan`, { method: "DELETE" })
    if (!res.ok) return toast.error("Could not delete the plan.")
    toast.success("Timetable deleted.")
    setEditing(false)
    load()
  }

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-[16px]" />)}</div>
  }

  if (!board) return null

  if (!board.plan || editing) {
    return (
      <div className="space-y-4">
        {!board.plan && (
          <div className="rounded-[16px] border border-dashed border-[#DFE2ED] bg-white px-4 py-8 text-center">
            <CalendarPlus className="w-8 h-8 text-[#6655DF] mx-auto mb-2.5" />
            <p className="text-[14px] font-bold text-[#171C35]">Put this programme on a timetable</p>
            <p className="text-[13px] text-[#69708A] mt-1 max-w-md mx-auto">
              Tell us the hours you can study and we&apos;ll spread the remaining lessons across them.
            </p>
          </div>
        )}
        <SlotEditor
          slug={slug} existing={board.plan} remainingMinutes={board.remaining.minutes}
          onSaved={() => { setEditing(false); load() }} onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  const { plan, sessions, remaining } = board
  const upcoming  = sessions.filter(s => s.status === "PLANNED")
  const missed    = sessions.filter(s => s.status === "MISSED")
  const done      = sessions.filter(s => s.status === "DONE")
  const finishesOn = upcoming.at(-1)?.date ?? null

  const STATUS_STYLE: Record<SessionStatus, string> = {
    PLANNED: "border-[#DFE2ED] bg-white",
    DONE:    "border-emerald-200 bg-emerald-50/60",
    MISSED:  "border-amber-200 bg-amber-50/60",
    SKIPPED: "border-[#F0EFFA] bg-[#FAFAFF] opacity-70",
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EFFA] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-bold text-[#171C35] flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-[#6655DF]" /> Your timetable
            </h3>
            <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">
              {plan.availability.map(s => `${DAYS[s.weekday]} ${s.start}–${s.end}`).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/student/programs/${slug}/study-plan/ics`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer no-underline"
            >
              <Download className="w-3.5 h-3.5" /> Calendar
            </a>
            <button
              type="button" onClick={replan} disabled={busy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", busy && "animate-spin")} /> Re-plan
            </button>
            <button
              type="button" onClick={() => setEditing(true)}
              className="px-3.5 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer"
            >
              Edit
            </button>
          </div>
        </div>

        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Per week",    value: fmtMins(plan.weeklyMinutes) },
            { label: "Left to do",  value: `${remaining.lessons} lessons` },
            { label: "Sessions done", value: `${done.length}/${sessions.length}` },
            { label: "Finishes",    value: finishesOn ? fmtDay(finishesOn) : "—" },
          ].map(s => (
            <div key={s.label} className="rounded-[12px] bg-[#FAFAFF] border border-[#F0EFFA] px-3.5 py-3">
              <p className="text-[15px] font-extrabold text-[#171C35] leading-tight">{s.value}</p>
              <p className={cn(metaCls, "mt-1.5")}>{s.label}</p>
            </div>
          ))}
        </div>

        {missed.length > 0 && (
          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-amber-800 flex-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {missed.length} session{missed.length === 1 ? "" : "s"} missed. Re-plan to push the rest forward.
            </p>
            <button
              type="button" onClick={replan} disabled={busy}
              className="px-3.5 py-1.5 rounded-[9px] text-[13px] font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
            >
              Re-plan now
            </button>
          </div>
        )}
      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#DFE2ED] bg-white px-4 py-10 text-center">
          <p className="text-[14px] font-bold text-[#171C35]">Nothing left to schedule.</p>
          <p className="text-[13px] text-[#69708A] mt-1">You&apos;ve completed every lesson in this programme.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {sessions.map(s => (
            <li key={s.id} className={cn("rounded-[14px] border p-3.5 flex items-start gap-3.5", STATUS_STYLE[s.status])}>
              <div className="w-14 shrink-0 text-center">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8A90A6]">
                  {fmtDay(s.date).split(" ")[0]}
                </p>
                <p className="text-[17px] font-extrabold text-[#171C35] leading-none mt-0.5">
                  {new Date(s.date).getUTCDate()}
                </p>
                <p className="text-[11px] font-bold text-[#8A90A6] mt-0.5">
                  {new Date(s.date).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#69708A]">
                  <Clock className="w-3.5 h-3.5" />
                  {hhmm(s.startMinute)}–{hhmm(s.endMinute)}
                  <span className="text-[#C9CCDD]">·</span>
                  ~{fmtMins(s.estimatedMinutes)}
                </p>
                {s.chapterTitle && (
                  <p className={cn(metaCls, "mt-1 truncate")}>{s.chapterTitle}</p>
                )}
                <ul className="mt-1.5 space-y-0.5">
                  {s.lessonTitles.map((t, i) => (
                    <li key={i} className="text-[13.5px] text-[#171C35] truncate">{i + 1}. {t}</li>
                  ))}
                </ul>
              </div>

              <div className="shrink-0 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus(s, s.status === "DONE" ? "PLANNED" : "DONE")}
                  aria-label={s.status === "DONE" ? "Mark not done" : "Mark done"}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-[10px] border cursor-pointer transition-colors",
                    s.status === "DONE"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-[#DFE2ED] bg-white text-[#8A90A6] hover:border-emerald-500 hover:text-emerald-600",
                  )}
                >
                  {s.status === "DONE" ? <CalendarCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button" onClick={remove}
        className="text-[13px] font-bold text-[#8A90A6] hover:text-red-500 cursor-pointer"
      >
        Delete this timetable
      </button>
    </div>
  )
}
