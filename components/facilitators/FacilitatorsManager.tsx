"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { EmptyState, Pill, RowActions, RowIcon, SearchInput } from "@/components/admin/AdminKit"
import { TableSkeletonRows } from "@/components/ui/skeleton"
import { FacilitatorAvatar } from "./FacilitatorAvatar"
import type { DirectoryFacilitator } from "./types"

// Loaded when first opened: it pulls in the rich-text editor.
const FacilitatorFormModal = dynamic(() => import("./FacilitatorFormModal"), { ssr: false })

/**
 * Programs → Facilitators. The directory every programme picks its
 * facilitators from. Editing an entry updates it on every programme that
 * lists it; deleting removes it from them (a programme left with nobody falls
 * back to the institute). The institute entry can be edited, not deleted.
 */
export default function FacilitatorsManager({ createRequest, onCount }: {
  /** Bumped by the page's "New Facilitator" button. */
  createRequest: number
  onCount?: (n: number) => void
}) {
  const [rows, setRows]         = useState<DirectoryFacilitator[] | null>(null)
  const [search, setSearch]     = useState("")
  const [editing, setEditing]   = useState<DirectoryFacilitator | "create" | null>(null)
  const [deleting, setDeleting] = useState<DirectoryFacilitator | null>(null)
  const [busy, setBusy]         = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/facilitators")
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setRows(d.facilitators ?? [])
    } catch {
      setRows([])
      toast.error("Could not load facilitators.")
    }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => { if (rows) onCount?.(rows.length) }, [rows, onCount])

  // The page header's button. Skip the initial value so mounting doesn't open it.
  const [seenRequest, setSeenRequest] = useState(createRequest)
  if (createRequest !== seenRequest) {
    setSeenRequest(createRequest)
    setEditing("create")
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!rows || !q) return rows ?? []
    return rows.filter(f => f.name.toLowerCase().includes(q) || f.title.toLowerCase().includes(q))
  }, [rows, search])

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      const res = await fetch(`/api/facilitators/${deleting.id}`, { method: "DELETE" })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(d.error ?? "Could not delete the facilitator."); return }
      toast.success(
        d.programmesUpdated
          ? `${deleting.name} was deleted and removed from ${d.programmesUpdated} programme${d.programmesUpdated === 1 ? "" : "s"}.`
          : `${deleting.name} was deleted.`,
      )
      setDeleting(null)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EFFA] flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-[14px] font-bold text-[#171C35]">Facilitator directory</h2>
          <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">
            Everyone who can be credited on a programme. Edits update every programme that lists them.
          </p>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search facilitators…" className="lg:ml-auto lg:w-64" />
      </div>

      {rows === null ? (
        <table className="w-full"><tbody><TableSkeletonRows rows={5} colSpan={4} /></tbody></table>
      ) : visible.length === 0 ? (
        <EmptyState
          className="border-0 rounded-none"
          title={rows.length === 0 ? "No facilitators yet." : "No facilitators match your search."}
          hint={rows.length === 0 ? "Add the people who teach your programmes." : undefined}
          action={rows.length === 0 ? (
            <button type="button" onClick={() => setEditing("create")} className="px-4 py-2 rounded-[10px] text-[13px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer">
              Add facilitator
            </button>
          ) : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8A90A6] border-b border-[#F0EFFA]">
                <th className="px-5 py-3 font-bold">Facilitator</th>
                <th className="px-5 py-3 font-bold hidden md:table-cell">Credentials</th>
                <th className="px-5 py-3 font-bold">Programmes</th>
                <th className="px-5 py-3 w-12"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFFA]">
              {visible.map(f => (
                <tr key={f.id} className="hover:bg-[#FAFAFF]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FacilitatorAvatar name={f.name} imageUrl={f.imageUrl} size={40} institute={f.isInstitute} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setEditing(f)} className="text-[13.5px] font-bold text-[#171C35] hover:text-[#6655DF] truncate text-left cursor-pointer">
                            {f.name}
                          </button>
                          {f.isInstitute && <Pill tone="brand">Default</Pill>}
                        </div>
                        <p className="text-[12px] text-[#69708A] truncate max-w-[42ch]">{f.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <p className="text-[12px] text-[#69708A] line-clamp-2 max-w-[36ch] whitespace-pre-line">{f.credentials || "—"}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[13px] font-bold text-[#171C35] tabular-nums">{f.programmes}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <RowActions
                      label={`Actions for ${f.name}`}
                      items={[
                        { label: "Edit", icon: RowIcon.edit, onSelect: () => setEditing(f) },
                        ...(f.isInstitute ? [] : [
                          { type: "separator" as const },
                          { label: "Delete", icon: RowIcon.trash, danger: true, onSelect: () => setDeleting(f) },
                        ]),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <FacilitatorFormModal
          facilitator={editing === "create" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(f, programmesUpdated) => {
            const created = editing === "create"
            setEditing(null)
            toast.success(created
              ? `${f.name} was added to the directory.`
              : programmesUpdated
                ? `${f.name} was updated on ${programmesUpdated} programme${programmesUpdated === 1 ? "" : "s"}.`
                : `${f.name} was updated.`)
            void load()
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-[#171C35]/40 px-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-facilitator-title">
          <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-sm p-5">
            <h3 id="delete-facilitator-title" className="text-[15px] font-extrabold text-[#171C35]">Delete {deleting.name}?</h3>
            <p className="text-[13px] text-[#69708A] mt-2 leading-relaxed">
              {deleting.programmes > 0
                ? `They'll be removed from ${deleting.programmes} programme${deleting.programmes === 1 ? "" : "s"}. A programme left without facilitators will credit the institute instead.`
                : "They aren't on any programme."}
              {" "}This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setDeleting(null)} disabled={busy} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:text-[#171C35] cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={busy} className="px-4 py-2 rounded-[10px] text-[13px] font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer">
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
