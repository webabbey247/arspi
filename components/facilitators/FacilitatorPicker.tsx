"use client"

import { useEffect, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { ArrowDown, ArrowUp, Check, Plus, Search, UserPlus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FacilitatorAvatar } from "./FacilitatorAvatar"
import FacilitatorFormModal from "./FacilitatorFormModal"
import {
  INSTITUTE_FACILITATOR_ID, toProgrammeFacilitator,
  type DirectoryFacilitator, type ProgrammeFacilitator,
} from "./types"

/**
 * The programme editor's Facilitators step: who is credited on the programme
 * page. New programmes start with the institute. "Add facilitator" searches
 * the directory; anyone not in it can be created on the spot.
 */
export default function FacilitatorPicker({ value, onChange }: {
  value: ProgrammeFacilitator[]
  onChange: (next: ProgrammeFacilitator[]) => void
}) {
  const [adding, setAdding] = useState(false)

  const selectedIds = new Set(value.map(f => f.facilitatorId).filter(Boolean) as string[])

  function move(i: number, by: -1 | 1) {
    const j = i + by
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[13px] text-[#69708A] leading-relaxed max-w-[60ch]">
          Facilitators are credited on the programme page, in this order. The institute is included by
          default. Add people from the facilitator directory, or create someone new.
        </p>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add facilitator
        </button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[#DFE2ED] px-4 py-10 text-center">
          <p className="text-[14px] font-bold text-[#171C35]">No facilitators selected</p>
          <p className="text-[12.5px] text-[#69708A] mt-1">The institute will be credited if you save without adding anyone.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {value.map((f, i) => {
            const institute = f.facilitatorId === INSTITUTE_FACILITATOR_ID
            return (
              <li key={f.facilitatorId ?? `${f.name}-${i}`} className="flex items-center gap-3 rounded-[14px] border border-[#DFE2ED] bg-white px-3.5 py-3">
                <FacilitatorAvatar name={f.name} imageUrl={f.imageUrl} size={44} institute={institute} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-[13.5px] font-bold text-[#171C35] truncate">{f.name}</p>
                    {institute && <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEECFF] text-[#6655DF]">Default</span>}
                    {!f.facilitatorId && <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700" title="Typed onto this programme before the directory existed">Not in directory</span>}
                  </div>
                  <p className="text-[12px] text-[#69708A] truncate">{f.title}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <IconButton label={`Move ${f.name} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-3.5 h-3.5" /></IconButton>
                  <IconButton label={`Move ${f.name} down`} disabled={i === value.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-3.5 h-3.5" /></IconButton>
                  <IconButton label={`Remove ${f.name}`} danger onClick={() => onChange(value.filter((_, k) => k !== i))}><X className="w-3.5 h-3.5" /></IconButton>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {adding && (
        <AddFacilitatorDialog
          selectedIds={selectedIds}
          onAdd={f => onChange([...value, toProgrammeFacilitator(f)])}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}

function IconButton({ label, disabled, danger, onClick, children }: {
  label: string; disabled?: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}
      className={cn(
        "w-7 h-7 grid place-items-center rounded-full text-[#8A90A6] disabled:opacity-30 disabled:cursor-default cursor-pointer",
        danger ? "hover:bg-rose-50 hover:text-rose-600" : "hover:bg-[#F0EFFA] hover:text-[#171C35]",
      )}
    >
      {children}
    </button>
  )
}

/** Search the directory; add as many as needed; create anyone missing. */
function AddFacilitatorDialog({ selectedIds, onAdd, onClose }: {
  selectedIds: Set<string>
  onAdd: (f: DirectoryFacilitator) => void
  onClose: () => void
}) {
  const [query, setQuery]       = useState("")
  const [results, setResults]   = useState<DirectoryFacilitator[] | null>(null)
  const [error, setError]       = useState("")
  const [creating, setCreating] = useState(false)
  // Added during this visit, so the button flips to "Added" straight away.
  const [added, setAdded]       = useState<Set<string>>(new Set())

  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/facilitators?limit=50${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ""}`, { signal: ctrl.signal })
        .then(r => r.json().then(d => ({ ok: r.ok, d })))
        .then(({ ok, d }) => {
          if (!ok) { setError(d.error ?? "Could not load facilitators."); setResults([]); return }
          setError("")
          setResults(d.facilitators ?? [])
        })
        .catch(e => { if ((e as Error).name !== "AbortError") { setError("Could not load facilitators."); setResults([]) } })
    }, query ? 250 : 0)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [query])

  function add(f: DirectoryFacilitator) {
    onAdd(f)
    setAdded(s => new Set(s).add(f.id))
  }

  const isIn = (id: string) => selectedIds.has(id) || added.has(id)

  return (
    <>
      <DialogPrimitive.Root open onOpenChange={o => { if (!o && !creating) onClose() }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[240] bg-[#171C35]/40" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed z-[250] inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-xl max-h-[86vh] bg-white sm:rounded-[18px] rounded-t-[18px] shadow-2xl flex flex-col overflow-hidden outline-none"
          >
            <div className="px-5 pt-5 pb-4 border-b border-[#F0EFFA] shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogPrimitive.Title className="text-[16px] font-extrabold text-[#171C35]">Add facilitator</DialogPrimitive.Title>
                  <p className="text-[12.5px] text-[#69708A] mt-0.5">Search the facilitator directory.</p>
                </div>
                <DialogPrimitive.Close asChild>
                  <button type="button" aria-label="Close" className="w-8 h-8 grid place-items-center rounded-full text-[#8A90A6] hover:bg-[#F0EFFA] hover:text-[#171C35] cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </DialogPrimitive.Close>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A90A6]" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by name or title…"
                  aria-label="Search facilitators"
                  className="w-full pl-9 pr-3 py-2.5 text-[13.5px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {results === null ? (
                <ul className="p-3 space-y-2" aria-busy>
                  {[0, 1, 2].map(i => <li key={i} className="h-14 rounded-[12px] bg-[#F5F6FB] animate-pulse" />)}
                </ul>
              ) : error ? (
                <p className="px-5 py-8 text-center text-[13px] text-rose-600">{error}</p>
              ) : results.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <span className="w-12 h-12 rounded-full bg-[#EEECFF] text-[#6655DF] grid place-items-center mx-auto mb-3"><UserPlus className="w-5 h-5" /></span>
                  <p className="text-[14px] font-bold text-[#171C35]">
                    {query.trim() ? <>No one matches “{query.trim()}”</> : "The directory is empty"}
                  </p>
                  <p className="text-[12.5px] text-[#69708A] mt-1">Add them as a new facilitator.</p>
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add new facilitator
                  </button>
                </div>
              ) : (
                <ul className="p-2">
                  {results.map(f => {
                    const inList = isIn(f.id)
                    return (
                      <li key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-[#FAFAFF]">
                        <FacilitatorAvatar name={f.name} imageUrl={f.imageUrl} size={40} institute={f.isInstitute} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-bold text-[#171C35] truncate">{f.name}</p>
                          <p className="text-[12px] text-[#69708A] truncate">
                            {f.title}
                            <span className="text-[#8A90A6]"> · {f.programmes} programme{f.programmes === 1 ? "" : "s"}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={inList}
                          onClick={() => add(f)}
                          className={cn(
                            "shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold cursor-pointer",
                            inList ? "bg-emerald-50 text-emerald-700 cursor-default" : "border border-[#6655DF] text-[#6655DF] hover:bg-[#EEECFF]",
                          )}
                        >
                          {inList ? <><Check className="w-3.5 h-3.5" /> Added</> : <><Plus className="w-3.5 h-3.5" /> Add</>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-[#F0EFFA] flex items-center justify-between gap-3 shrink-0">
              {results && results.length > 0 ? (
                <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#6655DF] hover:text-[#2C2368] cursor-pointer">
                  <UserPlus className="w-4 h-4" /> Not listed? Add new facilitator
                </button>
              ) : <span />}
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-bold bg-[#171C35] text-white hover:bg-[#2C2368] cursor-pointer">
                Done
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {creating && (
        <FacilitatorFormModal
          initialName={query.trim()}
          onClose={() => setCreating(false)}
          onSaved={f => {
            // New people go straight onto the programme.
            add(f)
            setResults(r => (r ? [f, ...r] : [f]))
            setCreating(false)
          }}
        />
      )}
    </>
  )
}
