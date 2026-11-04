"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Award, Download, ExternalLink, Link2, Search, ShieldCheck,
  Sparkles, Calendar, GraduationCap, Share2, Check,
} from "lucide-react"

/** Brand marks, inline: lucide-react removed its social icons, and pulling a
 *  second icon package in for two glyphs isn't worth it. */
const BrandIcon = {
  linkedin: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 shrink-0 fill-[#0A66C2]" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 shrink-0 fill-[#171C35]" aria-hidden="true">
      <path d="M18.9 2H22l-7 8 8.2 12H17l-5-7.3L6.3 22H3.2l7.5-8.6L3 2h6.3l4.5 6.6L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 shrink-0 fill-[#C13584]" aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.39C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.39 2.12.66.67 1.33 1.09 2.12 1.39.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.12-1.39.67-.66 1.09-1.33 1.39-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.39-2.12C21.32 1.35 20.65.93 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z"/>
    </svg>
  ),
}
import { cn } from "@/lib/utils"
import { DropdownMenu } from "@/components/ui/DropdownMenu"
import { MyCertificatesSkeleton } from "@/components/ui/skeleton"

type Certificate = {
  id:         string
  verifyCode: string
  issuedAt:   string
  expiresAt:  string | null
  course:     { id: string; title: string; slug: string }
}

const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

/** Guilloché-ish engraving, built from layered conic and radial gradients so
 *  the certificate reads as a document rather than a card — no image asset,
 *  so it stays crisp at any size and costs nothing to load. */
const ENGRAVING =
  "[background-image:repeating-conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.09)_0deg_2deg,transparent_2deg_6deg)," +
  "radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.18),transparent_45%)," +
  "radial-gradient(circle_at_85%_80%,rgba(255,255,255,0.12),transparent_40%)]"

// ── Share ────────────────────────────────────────────────────────────────────

/** Share targets for a certificate.
 *
 *  Rendered through the shared DropdownMenu, which portals its panel: the
 *  certificate card is `overflow-hidden` for its rounded corners, so a menu
 *  positioned inside it was clipped the moment it opened upward.
 *
 *  LinkedIn gets two entries because its "Add to profile" flow is the one a
 *  learner actually wants — it writes the credential into Licenses &
 *  Certifications rather than posting it to a feed where it scrolls away.
 *  Instagram has no web intent for sharing a URL at all, so the honest
 *  treatment is to copy the link and say where to paste it rather than open a
 *  window that can't carry it. */
function ShareMenu({ cert }: { cert: Certificate }) {
  const [copied, setCopied] = useState(false)

  const url = typeof window === "undefined" ? "" : `${window.location.origin}/verify/${cert.verifyCode}`
  const issued = new Date(cert.issuedAt)
  const text = `I've completed ${cert.course.title} at ARPS Institute.`

  async function copy(message: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success(message)
    } catch {
      toast.error("Could not copy the link.")
    }
  }

  function openShare(href: string) {
    window.open(href, "_blank", "noopener,noreferrer,width=680,height=640")
  }

  /** LinkedIn's certification intent — prefills the Licenses & Certifications
   *  entry, including the verification URL and the credential id. */
  const linkedInProfile =
    "https://www.linkedin.com/profile/add?" + new URLSearchParams({
      startTask:        "CERTIFICATION_NAME",
      name:             cert.course.title,
      organizationName: "ARPS Institute",
      issueYear:        String(issued.getFullYear()),
      issueMonth:       String(issued.getMonth() + 1),
      certUrl:          url,
      certId:           cert.verifyCode,
      ...(cert.expiresAt ? {
        expirationYear:  String(new Date(cert.expiresAt).getFullYear()),
        expirationMonth: String(new Date(cert.expiresAt).getMonth() + 1),
      } : {}),
    }).toString()

  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  const xShare = `https://twitter.com/intent/tweet?${new URLSearchParams({ text, url }).toString()}`

  return (
    <DropdownMenu
      triggerLabel="Share certificate"
      align="right"
      menuWidth="w-72"
      header="Share certificate"
      className="shrink-0"
      triggerClassName="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer transition-colors"
      activeTriggerClassName="border-[#6655DF] text-[#6655DF] bg-[#EEECFF]"
      // The native sheet reaches apps a web intent can't, so prefer it where
      // it exists and only fall back to the menu when it's absent or dismissed.
      onBeforeOpen={async () => {
        if (typeof navigator === "undefined" || !navigator.share) return true
        try {
          await navigator.share({ title: cert.course.title, text, url })
          return false
        } catch {
          return true
        }
      }}
      trigger={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
      items={[
        {
          label: "Add to LinkedIn profile",
          description: "Into Licenses & Certifications",
          icon: BrandIcon.linkedin,
          onSelect: () => openShare(linkedInProfile),
        },
        {
          label: "Post on LinkedIn",
          description: "Share to your feed",
          icon: BrandIcon.linkedin,
          onSelect: () => openShare(linkedInShare),
        },
        {
          label: "Share on X",
          description: "Opens a prefilled post",
          icon: BrandIcon.x,
          onSelect: () => openShare(xShare),
        },
        {
          label: "Instagram",
          description: "Copies the link to paste — Instagram has no web share",
          icon: BrandIcon.instagram,
          onSelect: () => copy("Link copied — paste it into your Instagram bio or story."),
        },
        { type: "separator" },
        {
          label: "Copy link",
          description: "Anyone can verify it, no account needed",
          icon: <Link2 className="w-4 h-4" />,
          onSelect: () => copy("Verification link copied."),
        },
      ]}
    />
  )
}

// ── Certificate card ─────────────────────────────────────────────────────────

function CertificateCard({ cert, index }: { cert: Certificate; index: number }) {
  const expired = cert.expiresAt ? new Date(cert.expiresAt) < new Date() : false

  return (
    <article className="group rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden hover:border-[#C8A96E] hover:shadow-[0_14px_38px_rgba(23,28,53,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col">

      {/* The certificate face */}
      <div className={cn(
        "relative px-5 pt-5 pb-6 bg-gradient-to-br from-[#171C35] via-[#241C61] to-[#3A2E7E] overflow-hidden",
        ENGRAVING,
      )}>
        {/* Gold rule */}
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#8A6E2F] via-[#E8CE8F] to-[#8A6E2F]" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.22em] uppercase font-extrabold text-[#E8CE8F]">
              Certificate of completion
            </p>
            <p className="text-[10px] tracking-[0.12em] uppercase font-bold text-white/45 mt-1">
              No. {String(index + 1).padStart(3, "0")}
            </p>
          </div>

          {/* Seal */}
          <span className="relative w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#E8CE8F] to-[#A98437] flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.3)]">
            <span className="absolute inset-[3px] rounded-full border border-[#171C35]/25" />
            <Award className="w-5 h-5 text-[#171C35]" />
          </span>
        </div>

        <p className="relative text-[17px] font-extrabold text-white leading-snug mt-5 line-clamp-2 min-h-11">
          {cert.course.title}
        </p>

        <div className="relative flex items-center gap-4 mt-4 pt-3 border-t border-white/15">
          <span>
            <span className="block text-[9px] tracking-[0.16em] uppercase font-extrabold text-white/40">Issued</span>
            <span className="block text-[12px] font-bold text-white/85 mt-0.5">{fmtDate(cert.issuedAt)}</span>
          </span>
          {cert.expiresAt && (
            <span>
              <span className="block text-[9px] tracking-[0.16em] uppercase font-extrabold text-white/40">
                {expired ? "Expired" : "Valid to"}
              </span>
              <span className={cn("block text-[12px] font-bold mt-0.5", expired ? "text-rose-300" : "text-white/85")}>
                {fmtDate(cert.expiresAt)}
              </span>
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-400/15 text-emerald-200 text-[10px] font-extrabold uppercase tracking-[0.08em]">
            <ShieldCheck className="w-3 h-3" />
            Verifiable
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3.5 flex items-center gap-2 mt-auto">
        <p className="min-w-0 flex-1">
          <span className={cn(metaCls, "block")}>Certificate ID</span>
          <span className="block text-[12px] font-mono text-[#69708A] truncate mt-0.5">{cert.verifyCode}</span>
        </p>
        <ShareMenu cert={cert} />
        <Link
          href={`/verify/${cert.verifyCode}`} target="_blank" rel="noopener noreferrer"
          aria-label="View certificate"
          className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] transition-colors shrink-0 no-underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <a
          href={`/api/certificates/verify/${cert.verifyCode}/download`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors shrink-0 no-underline"
        >
          <Download className="w-3.5 h-3.5" /> PDF
        </a>
      </div>
    </article>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const StudentCertificatesPage = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/student/certificates")
      const d = await r.json()
      if (r.ok) setCertificates(d.certificates ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? certificates.filter(c => c.course.title.toLowerCase().includes(q)) : certificates
  }, [certificates, search])

  const latest = certificates[0] ?? null
  const thisYear = certificates.filter(
    c => new Date(c.issuedAt).getFullYear() === new Date().getFullYear(),
  ).length

  if (loading) return <MyCertificatesSkeleton />

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Hero */}
      <section className={cn(
        "relative rounded-[22px] overflow-hidden mb-6 px-5 sm:px-8 py-7 sm:py-9",
        "bg-gradient-to-br from-[#171C35] via-[#241C61] to-[#4B3BA8]",
        ENGRAVING,
      )}>
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#8A6E2F] via-[#E8CE8F] to-[#8A6E2F]" />

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#E8CE8F] mb-1.5">Learner</span>
            <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-white">
              My Certificates
            </h1>
            <p className="text-white/65 text-[15px] mt-1.5 max-w-180">
              Every certificate carries a verification link anyone can check — no account needed.
            </p>
          </div>

          <div className="flex gap-3">
            {[
              { icon: <Award className="w-4 h-4" />,         label: "Earned",    value: certificates.length },
              { icon: <Sparkles className="w-4 h-4" />,      label: "This year", value: thisYear },
            ].map(s => (
              <div key={s.label} className="rounded-[14px] bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3 min-w-26">
                <span className="text-[#E8CE8F]">{s.icon}</span>
                <p className="text-[22px] font-extrabold text-white leading-none mt-1.5">{s.value}</p>
                <p className="text-[10px] tracking-[0.12em] uppercase font-extrabold text-white/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {latest && (
          <p className="relative mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[13px] font-bold text-white/85">
            <Calendar className="w-3.5 h-3.5 text-[#E8CE8F]" />
            Most recent: {latest.course.title} · {fmtDate(latest.issuedAt)}
          </p>
        )}
      </section>

      {/* Search */}
      {certificates.length > 0 && (
        <div className="relative w-full sm:w-72 mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A90A6]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search certificates…"
            className="w-full pl-9 pr-3 py-2 text-[14px] font-bold bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:font-normal placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
          />
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#DFE2ED] bg-white px-4 py-16 text-center">
          <span className="w-14 h-14 rounded-full bg-[#EEECFF] flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6 text-[#6655DF]" />
          </span>
          <p className="text-[15px] font-bold text-[#171C35]">
            {search.trim() ? `No certificates match “${search.trim()}”.` : "No certificates yet."}
          </p>
          {!search.trim() && (
            <>
              <p className="text-[13.5px] text-[#69708A] mt-1.5 max-w-sm mx-auto">
                Finish a programme and your certificate is issued automatically — nothing to apply for.
              </p>
              <Link
                href="/student/programs"
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors no-underline"
              >
                Back to my learning
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((cert, i) => <CertificateCard key={cert.id} cert={cert} index={i} />)}
        </div>
      )}
    </div>
  )
}

export default StudentCertificatesPage
