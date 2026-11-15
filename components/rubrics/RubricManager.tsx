"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { TableSkeletonRows, SkeletonCardList } from "@/components/ui/skeleton"
import { RowActions, RowIcon } from "@/components/admin/AdminKit"
import type { DropdownItem } from "@/components/ui/DropdownMenu"
import RubricBuilder, { type BuilderTarget } from "@/components/rubrics/RubricBuilder"
import { RubricPreviewButton, loadRubricLibrary } from "@/components/rubrics/RubricPicker"
import type { RubricListItem } from "@/services/rubric.service"
import { contentOf, type RubricStatus, type RubricVersionView } from "@/lib/rubric"

const STATUS_PILL: Record<RubricStatus, string> = {
  ACTIVE:   "bg-emerald-50 text-emerald-700",
  DRAFT:    "bg-amber-50 text-amber-700",
  ARCHIVED: "bg-[#F5F6FB] text-[#69708A]",
}

type Filter = "all" | "ACTIVE" | "DRAFT" | "ARCHIVED"

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

/**
 * Programs → Rubrics. The library of reusable marking rubrics: create, edit,
 * duplicate, activate and archive. Only active rubrics are offered when
 * attaching one to an assignment or project.
 *
 * `createRequest` is bumped by the page header's "New Rubric" button so this
 * tab can live under the shared header like Categories and Levels do.
 */
export default function RubricManager({
  createRequest, onCount,
}: {
  createRequest: number
  onCount?: (n: number) => void
}) {
  const [rows, setRows]       = useState<RubricListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [filter, setFilter]   = useState<Filter>("all")
  const [builder, setBuilder] = useState<BuilderTarget | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/programs/rubrics")
      const d = await res.json()
      if (res.ok) {
        setRows(d.rubrics ?? [])
        onCount?.((d.rubrics ?? []).length)
      } else toast.error(d.error ?? "Could not load rubrics.")
    } finally {
      setLoading(false)
    }
    // Refresh the pickers' shared cache too.
    loadRubricLibrary(true)
  }, [onCount])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (createRequest > 0) setBuilder({ mode: "create" }) }, [createRequest])

  async function openEditor(row: RubricListItem) {
    const res = await fetch(`/api/programs/rubrics/${row.id}`)
    const d = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(d.error ?? "Could not open the rubric.")
    const v = d.rubric.current as RubricVersionView
    setBuilder({
      mode: "edit", rubricId: row.id, status: d.rubric.status, version: v.version, markedCount: row.markedCount,
      content: contentOf(v),
    })
  }

  async function setStatus(row: RubricListItem, status: RubricStatus) {
    const res = await fetch(`/api/programs/rubrics/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(d.error ?? "Could not update the rubric.")
    toast.success(
      status === "ARCHIVED" ? "Archived. Assignments already using it keep it."
        : status === "ACTIVE" ? "Active — it can now be attached to assignments." : "Moved back to draft.",
    )
    load()
  }

  async function duplicate(row: RubricListItem) {
    const res = await fetch(`/api/programs/rubrics/${row.id}/duplicate`, { method: "POST" })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(d.error ?? "Could not duplicate.")
    toast.success("Duplicated as a draft.")
    load()
  }

  function actions(row: RubricListItem): DropdownItem[] {
    const items: DropdownItem[] = [
      { label: "Edit rubric", icon: RowIcon.edit, onSelect: () => openEditor(row) },
      { label: "Duplicate",   onSelect: () => duplicate(row) },
      { type: "separator" },
    ]
    if (row.status !== "ACTIVE")   items.push({ label: row.status === "ARCHIVED" ? "Restore as active" : "Activate", onSelect: () => setStatus(row, "ACTIVE") })
    if (row.status === "ACTIVE")   items.push({ label: "Move to draft", onSelect: () => setStatus(row, "DRAFT") })
    if (row.status !== "ARCHIVED") items.push({ label: "Archive", danger: true, onSelect: () => setStatus(row, "ARCHIVED") })
    return items
  }

  const counts = {
    all:      rows.length,
    ACTIVE:   rows.filter(r => r.status === "ACTIVE").length,
    DRAFT:    rows.filter(r => r.status === "DRAFT").length,
    ARCHIVED: rows.filter(r => r.status === "ARCHIVED").length,
  }
  const visible = rows.filter(r =>
    (filter === "all" || r.status === filter) &&
    (!search || r.title.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <>
      <div className="rounded-[16px] border border-[#DFE2ED] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 bg-white border-b border-[#DFE2ED]">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rubrics…" aria-label="Search rubrics" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors" />
          </div>
          <div className="sm:ml-auto flex gap-1 bg-[#F5F6FB] rounded-[10px] p-0.5 overflow-x-auto">
            {(["all", "ACTIVE", "DRAFT", "ARCHIVED"] as Filter[]).map(f => (
              <button
                key={f} type="button" onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-[8px] text-[12px] font-semibold capitalize cursor-pointer",
                  filter === f ? "bg-white text-[#171C35] shadow-sm" : "text-[#69708A] hover:text-[#171C35]",
                )}
              >
                {f.toLowerCase()} <span className="font-normal text-[#8A90A6]">({counts[f]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAFF] border-b border-[#DFE2ED]">
                {["Rubric", "Status", "Points", "Criteria", "In use", "Updated", ""].map(col => (
                  <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#8A90A6] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows colSpan={7} />
              ) : visible.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[#8A90A6]">
                  {rows.length === 0 ? "No rubrics yet. Create one — or start from the generic written-assignment template." : "No rubrics match."}
                </td></tr>
              ) : visible.map(row => (
                <tr key={row.id} className="border-b border-[#F0EFFA] last:border-none hover:bg-[#FAFAFF] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#171C35]">
                      {row.title}
                      {row.isDefault && <span className="ml-2 align-middle px-1.5 py-0.5 rounded-full bg-[#EEECFF] text-[#6655DF] text-[10px] font-bold uppercase tracking-[0.06em]">Default</span>}
                    </p>
                    <p className="text-[11.5px] text-[#8A90A6] mt-0.5">
                      v{row.currentVersion} · {row.levelCount} levels{row.visibleToLearners ? "" : " · hidden from learners"}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize", STATUS_PILL[row.status])}>{row.status.toLowerCase()}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#69708A]">{row.totalPoints} <span className="text-[#8A90A6]">· pass {row.passMark}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#69708A]">{row.criteriaCount}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#69708A]">
                    {row.projectCount} project{row.projectCount === 1 ? "" : "s"} · {row.markedCount} marked
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#69708A]">{fmtDate(row.updatedAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 justify-end">
                      <RubricPreviewButton rubricId={row.id} className="px-2.5 py-1 rounded-[8px] border border-[#DFE2ED] text-[12px] font-semibold text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer inline-flex items-center gap-1" />
                      <RowActions label={`Actions for ${row.title}`} items={actions(row)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden flex flex-col">
          {loading ? <SkeletonCardList /> : visible.length === 0 ? (
            <div className="px-4 py-10 text-center text-[#8A90A6] text-[13px]">{rows.length === 0 ? "No rubrics yet." : "No rubrics match."}</div>
          ) : visible.map(row => (
            <div key={row.id} className="px-4 py-4 border-b border-[#F0EFFA] last:border-none flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-[#171C35] text-[14px] leading-tight">
                  {row.title}{row.isDefault && <span className="ml-1.5 text-[10px] font-bold text-[#6655DF] uppercase">Default</span>}
                </p>
                <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize shrink-0", STATUS_PILL[row.status])}>{row.status.toLowerCase()}</span>
              </div>
              <p className="text-[12px] text-[#69708A]">
                v{row.currentVersion} · {row.totalPoints} pts · pass {row.passMark} · {row.criteriaCount} criteria · {row.markedCount} marked
              </p>
              <div className="flex items-center gap-2">
                <RubricPreviewButton rubricId={row.id} />
                <div className="ml-auto"><RowActions label={`Actions for ${row.title}`} items={actions(row)} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {builder && <RubricBuilder target={builder} onClose={() => setBuilder(null)} onSaved={load} />}
    </>
  )
}
