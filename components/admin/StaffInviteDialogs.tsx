"use client"

import { useState } from "react"
import { toast } from "sonner"
import { X, Upload, CheckCircle2, AlertTriangle, MailWarning } from "lucide-react"
import { cn } from "@/lib/utils"

const inputCls = "w-full px-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
const labelCls = "block text-[11px] font-bold text-[#69708A] uppercase tracking-[0.4px] mb-1"

function Shell({ title, subtitle, onClose, children, footer, wide }: {
  title: string; subtitle: string; onClose: () => void
  children: React.ReactNode; footer: React.ReactNode; wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#171C35]/45 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={cn("bg-white rounded-[18px] shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] px-5 py-4 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-[16px] font-extrabold text-white">{title}</h2>
            <p className="text-[12px] text-white/75 mt-0.5">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <div className="shrink-0 flex justify-end gap-2 px-5 py-4 border-t border-[#DFE2ED] bg-[#FAFAFF]">{footer}</div>
      </div>
    </div>
  )
}

const btnGhost   = "px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-white cursor-pointer"
const btnPrimary = "px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"

// ── Invite one ───────────────────────────────────────────────────────────────

export function InviteInstructorDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail]         = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName]   = useState("")
  const [busy, setBusy]           = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const res = await fetch("/api/admin/staff/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, lastName }),
    })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return toast.error(d.error ?? "Could not send the invite.")
    if (!d.emailSent) toast.warning("Account created, but the invitation email failed to send. Use “Resend invite”.")
    else toast.success(d.outcome === "resent" ? `Invite re-sent to ${email}.` : `Invitation sent to ${email}.`)
    onDone()
  }

  return (
    <form onSubmit={submit}>
      <Shell
        title="Invite an instructor"
        subtitle="They'll get an email to set a password and join as an instructor."
        onClose={onClose}
        footer={<>
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" disabled={busy || !email.trim()} className={btnPrimary}>{busy ? "Sending…" : "Send invitation"}</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="inv-email" className={labelCls}>Email</label>
            <input id="inv-email" type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-first" className={labelCls}>First name</label>
              <input id="inv-first" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="inv-last" className={labelCls}>Last name</label>
              <input id="inv-last" value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
            </div>
          </div>
          <p className="text-[12px] text-[#8A90A6]">
            The link expires in 7 days. If the email already belongs to a student or another staff member, they won&apos;t be changed.
          </p>
        </div>
      </Shell>
    </form>
  )
}

// ── Import many ──────────────────────────────────────────────────────────────

type Row = { email: string; firstName?: string; lastName?: string }
type Result = { email: string; outcome: "invited" | "resent" | "skipped"; emailSent?: boolean; error?: string }

/** Minimal CSV parser: commas, quoted fields with "" escapes, CRLF/LF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], field = "", q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') q = false
      else field += c
    } else if (c === '"') q = true
    else if (c === ",") { row.push(field); field = "" }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(field); rows.push(row); row = []; field = ""
    } else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows.map(r => r.map(x => x.trim())).filter(r => r.some(Boolean))
}

/** Reads email / first / last name, by header if there is one, else by position. */
function toRows(table: string[][]): Row[] {
  if (table.length === 0) return []
  const head = table[0].map(h => h.toLowerCase().replace(/[^a-z]/g, ""))
  const hasHeader = head.includes("email") || head.includes("emailaddress")
  const col = (names: string[], fallback: number) => {
    if (!hasHeader) return fallback
    const i = head.findIndex(h => names.includes(h))
    return i
  }
  const e = col(["email", "emailaddress"], 0)
  const f = col(["firstname", "first", "givenname"], 1)
  const l = col(["lastname", "last", "surname", "familyname"], 2)
  return (hasHeader ? table.slice(1) : table).map(r => ({
    email: r[e] ?? "",
    firstName: f >= 0 ? r[f] || undefined : undefined,
    lastName: l >= 0 ? r[l] || undefined : undefined,
  })).filter(r => r.email)
}

export function ImportInstructorsDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [rows, setRows]       = useState<Row[]>([])
  const [fileName, setFile]   = useState("")
  const [busy, setBusy]       = useState(false)
  const [results, setResults] = useState<Result[] | null>(null)

  async function pick(file: File | undefined) {
    if (!file) return
    setFile(file.name)
    setResults(null)
    const parsed = toRows(parseCsv(await file.text()))
    if (parsed.length === 0) toast.error("No email addresses found in that file.")
    if (parsed.length > 200) toast.error("Up to 200 instructors per import — only the first 200 will be sent.")
    setRows(parsed.slice(0, 200))
  }

  function downloadTemplate() {
    const blob = new Blob(["email,first name,last name\njane@example.com,Jane,Doe\n"], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "instructor-import-template.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  async function submit() {
    setBusy(true)
    const res = await fetch("/api/admin/staff/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return toast.error(d.error ?? "Import failed.")
    setResults(d.results ?? [])
    onDone()
  }

  const sent    = results?.filter(r => r.outcome !== "skipped" && r.emailSent).length ?? 0
  const noEmail = results?.filter(r => r.outcome !== "skipped" && !r.emailSent).length ?? 0
  const skipped = results?.filter(r => r.outcome === "skipped").length ?? 0

  return (
    <Shell
      wide
      title="Import instructors"
      subtitle="Upload a CSV. Each new address gets an invitation email automatically."
      onClose={onClose}
      footer={results ? (
        <button type="button" onClick={onClose} className={btnPrimary}>Done</button>
      ) : <>
        <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
        <button type="button" onClick={submit} disabled={busy || rows.length === 0} className={btnPrimary}>
          {busy ? `Inviting ${rows.length}…` : `Invite ${rows.length || ""} instructor${rows.length === 1 ? "" : "s"}`}
        </button>
      </>}
    >
      {!results ? (
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-2 py-7 rounded-[12px] border border-dashed border-[#C9CCDD] hover:border-[#6655DF] cursor-pointer transition-colors">
            <Upload className="w-5 h-5 text-[#6655DF]" />
            <span className="text-[14px] font-bold text-[#6655DF]">{fileName || "Choose a CSV file"}</span>
            <span className="text-[12px] text-[#8A90A6]">Columns: email, first name, last name</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={e => pick(e.target.files?.[0])} />
          </label>
          <button type="button" onClick={downloadTemplate} className="text-[12.5px] font-bold text-[#6655DF] hover:underline cursor-pointer">
            Download a template
          </button>
          {rows.length > 0 && (
            <div className="rounded-[12px] border border-[#DFE2ED] overflow-hidden">
              <p className="px-3.5 py-2 bg-[#FAFAFF] border-b border-[#DFE2ED] text-[12px] font-bold text-[#69708A]">
                {rows.length} row{rows.length === 1 ? "" : "s"} ready
              </p>
              <ul className="max-h-56 overflow-y-auto divide-y divide-[#F0EFFA]">
                {rows.map((r, i) => (
                  <li key={i} className="px-3.5 py-2 text-[13px] flex justify-between gap-3">
                    <span className="text-[#171C35] font-semibold truncate">{r.email}</span>
                    <span className="text-[#8A90A6] truncate">{[r.firstName, r.lastName].filter(Boolean).join(" ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[13.5px] text-[#171C35]">
            <b>{sent}</b> invited · {noEmail > 0 && <><b>{noEmail}</b> created but email failed · </>}<b>{skipped}</b> skipped
          </p>
          <ul className="rounded-[12px] border border-[#DFE2ED] max-h-72 overflow-y-auto divide-y divide-[#F0EFFA]">
            {results.map((r, i) => (
              <li key={i} className="px-3.5 py-2 text-[13px] flex items-start gap-2">
                {r.outcome === "skipped" ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  : r.emailSent ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  : <MailWarning className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                <span className="min-w-0">
                  <span className="font-semibold text-[#171C35] break-all">{r.email}</span>
                  <span className="block text-[12px] text-[#69708A]">
                    {r.outcome === "skipped" ? r.error
                      : !r.emailSent ? "Account created — email failed. Use “Resend invite”."
                      : r.outcome === "resent" ? "Invite re-sent" : "Invited"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Shell>
  )
}
