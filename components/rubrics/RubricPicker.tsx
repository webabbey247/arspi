"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Eye, PencilLine, Copy } from "lucide-react"
import { RubricGrid, RubricSidePanel } from "@/components/rubrics/RubricGrid"
import RubricBuilder, { type BuilderTarget } from "@/components/rubrics/RubricBuilder"
import { useRubricScope } from "@/components/rubrics/RubricScope"
import { contentOf, type RubricStatus, type RubricVersionView } from "@/lib/rubric"

export type RubricOption = {
  id: string
  title: string
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  totalPoints: number
  criteriaCount: number
  currentVersion: number
  /** Set when this is a copy customised for one programme. */
  courseId: string | null
  isDefault: boolean
  markedCount: number
}

// One request per scope per page load, shared by every picker on the screen —
// a lesson can hold many assignment blocks. Keyed by programme ("" = library).
const cache = new Map<string, Promise<RubricOption[]>>()
const listeners = new Set<() => void>()

export function loadRubricLibrary(force = false, courseId?: string | null): Promise<RubricOption[]> {
  const key = courseId ?? ""
  if (force) {
    // Every scope includes the library, so any change invalidates them all.
    cache.clear()
    listeners.forEach(fn => fn())
  }
  let p = cache.get(key)
  if (!p) {
    p = fetch(courseId ? `/api/programs/rubrics?courseId=${encodeURIComponent(courseId)}` : "/api/programs/rubrics")
      .then(r => (r.ok ? r.json() : { rubrics: [] }))
      .then(d => (d.rubrics ?? []) as RubricOption[])
      .catch(() => {
        cache.delete(key)
        return []
      })
    cache.set(key, p)
  }
  return p
}

/** The rubrics a picker can offer: the library, plus the current programme's
 *  own copies when used inside a programme editor. */
export function useRubricLibrary() {
  const scope = useRubricScope()
  const courseId = scope?.courseId ?? null
  const [state, setState] = useState<{ key: string; rubrics: RubricOption[] } | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const bump = () => setVersion(v => v + 1)
    listeners.add(bump)
    return () => { listeners.delete(bump) }
  }, [])

  useEffect(() => {
    let live = true
    loadRubricLibrary(false, courseId).then(r => { if (live) setState({ key: courseId ?? "", rubrics: r }) })
    return () => { live = false }
  }, [courseId, version])

  // Never show one programme's list while another's is loading.
  return state && state.key === (courseId ?? "") ? state.rubrics : null
}

async function fetchCurrent(rubricId: string) {
  const res = await fetch(`/api/programs/rubrics/${rubricId}`)
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.error ?? "Could not load the rubric.")
  return d.rubric as { status: RubricStatus; courseId: string | null; current: RubricVersionView }
}

/** Opens a rubric (current version) in the side panel — staff only. */
export function RubricPreviewButton({ rubricId, className }: { rubricId: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const [rubric, setRubric] = useState<RubricVersionView | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || rubric?.rubricId === rubricId) return
    let live = true
    fetchCurrent(rubricId)
      .then(d => { if (live) setRubric(d.current) })
      .catch(e => { if (live) setError(e.message) })
    return () => { live = false }
  }, [open, rubricId, rubric?.rubricId])

  return (
    <>
      <button
        type="button" onClick={() => { setError(null); setOpen(true) }}
        className={className ?? "inline-flex items-center gap-1 text-[12px] font-bold text-[#6655DF] hover:underline underline-offset-2 cursor-pointer"}
      >
        <Eye className="w-3.5 h-3.5" /> Preview rubric
      </button>
      <RubricSidePanel
        open={open} onOpenChange={setOpen}
        title={rubric?.title ?? "Rubric"}
        subtitle={rubric ? `Version ${rubric.version} · ${rubric.totalPoints} points · pass mark ${rubric.passMark}` : undefined}
      >
        {error ? <p className="text-[14px] text-red-600">{error}</p>
          : rubric ? <RubricGrid rubric={rubric} />
          : <div className="h-60 rounded-[14px] bg-[#F5F6FB] animate-pulse" />}
      </RubricSidePanel>
    </>
  )
}

const linkCls = "inline-flex items-center gap-1 text-[11.5px] font-bold text-[#6655DF] hover:underline underline-offset-2 cursor-pointer disabled:opacity-50"

/**
 * Rubric dropdown, used on assignment blocks and the course project.
 *
 * Inside a programme editor it lists that programme's own rubrics first, then
 * the shared library (the default marked). Picking a library rubric and
 * choosing "Customise for this programme" opens it in the builder; saving
 * creates a copy owned by the programme and selects it, leaving the library
 * rubric — and every other programme — untouched.
 *
 * A rubric already attached stays listed (and labelled) even if archived, so
 * opening an old assignment never silently drops its rubric.
 */
export default function RubricPicker({
  value, onChange, selectCls, emptyLabel = "No rubric",
}: {
  value: string | null | undefined
  onChange: (rubricId: string | null, rubric: RubricOption | null) => void
  selectCls: string
  emptyLabel?: string
}) {
  const scope = useRubricScope()
  const library = useRubricLibrary()
  const [builder, setBuilder] = useState<BuilderTarget | null>(null)
  const [opening, setOpening] = useState(false)

  const usable = (library ?? []).filter(r => r.status === "ACTIVE" || r.id === value)
  const mine   = usable.filter(r => r.courseId)
  const shared = usable.filter(r => !r.courseId)
  const selected = library?.find(r => r.id === value) ?? null
  const isOwnCopy = !!selected?.courseId && selected.courseId === scope?.courseId

  const label = (r: RubricOption) =>
    `${r.title} (${r.totalPoints} pts)${r.isDefault ? " — default" : ""}${r.status !== "ACTIVE" ? ` — ${r.status.toLowerCase()}` : ""}`

  async function openBuilder() {
    if (!selected || !scope) return
    setOpening(true)
    try {
      const d = await fetchCurrent(selected.id)
      setBuilder(isOwnCopy
        ? {
            mode: "edit", rubricId: selected.id, status: d.status, content: contentOf(d.current),
            version: d.current.version, markedCount: selected.markedCount, courseId: scope.courseId,
          }
        : {
            mode: "create", courseId: scope.courseId, courseTitle: scope.courseTitle,
            initial: contentOf(d.current),
          })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the rubric.")
    } finally {
      setOpening(false)
    }
  }

  async function onSaved(rubricId: string) {
    const fresh = await loadRubricLibrary(true, scope?.courseId)
    const picked = fresh.find(r => r.id === rubricId) ?? null
    // Re-select so points pick up the (possibly changed) total.
    onChange(rubricId, picked)
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={value ?? ""}
        disabled={library === null}
        onChange={e => {
          const id = e.target.value || null
          onChange(id, library?.find(r => r.id === id) ?? null)
        }}
        className={selectCls}
      >
        <option value="">{library === null ? "Loading rubrics…" : emptyLabel}</option>
        {mine.length > 0 && (
          <optgroup label="This programme">
            {mine.map(r => <option key={r.id} value={r.id}>{label(r)}</option>)}
          </optgroup>
        )}
        {shared.length > 0 && (
          <optgroup label="Library">
            {shared.map(r => <option key={r.id} value={r.id}>{label(r)}</option>)}
          </optgroup>
        )}
        {value && library !== null && !selected && (
          <option value={value}>Unavailable rubric</option>
        )}
      </select>

      {value && selected && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <RubricPreviewButton rubricId={value} className={linkCls} />
          {scope ? (
            <button type="button" onClick={openBuilder} disabled={opening} className={linkCls}>
              {isOwnCopy
                ? <><PencilLine className="w-3.5 h-3.5" /> Edit for this programme</>
                : <><Copy className="w-3.5 h-3.5" /> Customise for this programme</>}
            </button>
          ) : (
            <span className="text-[11px] text-[#8A90A6]">Save the programme to customise its rubric.</span>
          )}
          {isOwnCopy && <span className="text-[11px] font-bold text-[#8A90A6]">Used by this programme only</span>}
        </div>
      )}

      {builder && <RubricBuilder target={builder} onClose={() => setBuilder(null)} onSaved={onSaved} />}
    </div>
  )
}
