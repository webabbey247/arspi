"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Check, X, ShieldCheck, GraduationCap, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUploadThing } from "@/lib/uploadthing-client"
import { SettingsSkeleton, InlineSkeleton } from "@/components/ui/skeleton"
import { PhoneCodeSelect } from "@/components/ui/PhoneCodeSelect"
import { DatePicker, toISODate } from "@/components/ui/DatePicker"
import { COUNTRIES } from "@/lib/countries"
import type { AccountProfile } from "@/services/profile.service"
import type { DeviceSession } from "@/services/session.service"

type Role = "ADMIN" | "INSTRUCTOR" | "USER"

const ROLE_LABELS: Record<Role, string> = {
  ADMIN:      "Admin",
  INSTRUCTOR: "Instructor",
  USER:       "Student",
}


const ROLE_ICONS: Record<Role, React.ReactNode> = {
  ADMIN:      <ShieldCheck className="w-3 h-3" />,
  INSTRUCTOR: <GraduationCap className="w-3 h-3" />,
  USER:       <UserIcon className="w-3 h-3" />,
}

// ── Shared input classes ──────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 rounded-[10px] border border-[#DFE2ED] text-[13px] text-[#171C35] bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#6655DF]/20 focus:border-[#6655DF] transition-colors " +
  "placeholder:text-[#8A90A6] disabled:bg-[#F5F6FB] disabled:text-[#8A90A6] " +
  "read-only:bg-[#F5F6FB] read-only:text-[#8A90A6] read-only:cursor-not-allowed read-only:focus:ring-0 read-only:focus:border-[#DFE2ED]"
const labelCls = "block text-[11px] font-semibold text-[#69708A] mb-1.5 uppercase tracking-[0.5px]"

// ── Profile form ──────────────────────────────────────────────────────────────

type ProfileValues = {
  firstName:        string
  lastName:         string
  phoneCountryCode: string
  phone:            string
  country:          string
  jobTitle:         string
  organisation:     string
  bio:              string
  dateOfBirth:      string
}

const profileSchema: yup.ObjectSchema<ProfileValues> = yup.object({
  firstName:        yup.string().trim().min(2, "Min 2 characters").max(50).required("First name is required"),
  lastName:         yup.string().trim().min(2, "Min 2 characters").max(50).required("Last name is required"),
  phoneCountryCode: yup.string().trim().default("+234"),
  phone:            yup.string().trim().max(50).default(""),
  country:          yup.string().trim().max(100).default(""),
  jobTitle:         yup.string().trim().max(100).default(""),
  organisation:     yup.string().trim().max(150).default(""),
  bio:              yup.string().trim().max(500, "Max 500 characters").default(""),
  dateOfBirth:      yup.string().trim().default(""),
})

// ── Password form ─────────────────────────────────────────────────────────────

type PasswordValues = {
  currentPassword: string
  newPassword:     string
  confirmPassword: string
}

const passwordSchema: yup.ObjectSchema<PasswordValues> = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .min(8, "Min 8 characters")
    .matches(/[A-Z]/, "Must contain an uppercase letter")
    .matches(/[0-9]/, "Must contain a number")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .required("Please confirm the new password"),
})

// ── Contact Information form ──────────────────────────────────────────────────

type ContactInfoValues = {
  addressLine1: string
  addressLine2: string
  city:         string
  state:        string
  postalCode:   string
}

const contactInfoSchema: yup.ObjectSchema<ContactInfoValues> = yup.object({
  addressLine1: yup.string().trim().max(150).default(""),
  addressLine2: yup.string().trim().max(150).default(""),
  city:         yup.string().trim().max(80).default(""),
  state:        yup.string().trim().max(80).default(""),
  postalCode:   yup.string().trim().max(20).default(""),
})

// ── Configuration form ────────────────────────────────────────────────────────

type ConfigValues = {
  language:   string
  timezone:   string
  emailOptIn: boolean
}

const configSchema: yup.ObjectSchema<ConfigValues> = yup.object({
  language:   yup.string().trim().default(""),
  timezone:   yup.string().trim().default(""),
  emailOptIn: yup.boolean().default(true),
})

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
]

const TIMEZONE_OPTIONS: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf(key: string): string[] })
      .supportedValuesOf("timeZone")
  } catch {
    return []
  }
})()

/** Dial codes longest-first, so "+1268" is matched before "+1". Built once:
 *  the list is static and this runs on every profile load. */
const DIAL_CODES_LONGEST_FIRST = Array.from(new Set(COUNTRIES.map(c => c.dialCode)))
  .sort((a, b) => b.length - a.length)

function splitPhone(phone: string | null | undefined): { code: string; number: string } {
  const trimmed = (phone ?? "").trim()
  if (!trimmed) return { code: "+234", number: "" }
  for (const code of DIAL_CODES_LONGEST_FIRST) {
    if (trimmed.startsWith(code)) {
      return { code, number: trimmed.slice(code.length).trim() }
    }
  }
  return { code: "+234", number: trimmed }
}

function combinePhone(code: string, number: string): string {
  const cleaned = number.trim()
  if (!cleaned) return ""
  return `${code} ${cleaned}`
}

const dash = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : String(v)

/** A titled card with an icon and a note — the unit every settings panel is
 *  built from, matching the console's Section. */
function Section({
  id, icon, eyebrow, title, note, action, children,
}: {
  id?: string
  icon: React.ReactNode; eyebrow: string; title: string; note?: string
  action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <section id={id} className="min-w-0 scroll-mt-6 rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 sm:px-6 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">
              <span className="text-[#6655DF]">{icon}</span>
              {eyebrow}
            </p>
            <h2 className="mt-2 text-[20px] leading-[1.25] tracking-[-0.02em] font-extrabold text-[#171C35]">{title}</h2>
            {note && <p className="mt-1.5 max-w-prose text-[13.5px] leading-relaxed text-[#69708A]">{note}</p>}
          </div>
          {action}
        </div>
        {/* Dashed, so the intro reads as a preamble to the card rather than as
            another banded header like the tables elsewhere. */}
        <div className="mt-5 border-t border-dashed border-[#DFE2ED]" />
      </div>
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </section>
  )
}

/** A card for the operator view: a filled dark icon tile, title and one line
 *  of explanation. Dark rather than the lavender chip used elsewhere, so the
 *  operator screen reads as account administration and not as a profile. */
function OpsCard({
  title, note, children,
}: {
  title: string; note?: string; children: React.ReactNode
}) {
  return (
    <section className="min-w-0 rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EFFA]">
        <h2 className="text-[15px] font-extrabold text-[#171C35]">{title}</h2>
        {note && <p className="mt-0.5 text-[13px] text-[#69708A]">{note}</p>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  )
}

/** Uppercase label over a value — the operator record's unit. */
function OpsFact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">{label}</dt>
      <dd className="mt-1 text-[14.5px] font-bold text-[#171C35] break-words">{value}</dd>
    </div>
  )
}

/** Password input with a reveal toggle.
 *
 *  `type` is swapped rather than the value being mirrored into a text input,
 *  so the field keeps its autocomplete behaviour and the browser's password
 *  manager still recognises it. The button is excluded from the tab order:
 *  it is a convenience, and stopping between every password field to skip it
 *  would be worse than not having it. */
function PasswordInput({
  label, error, inputClassName, ...field
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  inputClassName: string
}) {
  const [shown, setShown] = useState(false)
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          {...field}
          type={shown ? "text" : "password"}
          className={cn(inputClassName, "pr-10")}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShown(v => !v)}
          aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-[7px] text-[#8A90A6] hover:text-[#171C35] hover:bg-[#F5F6FB] cursor-pointer transition-colors"
        >
          {shown ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}

/** Relative where it reads better than a timestamp, absolute once it is old
 *  enough that "12 days ago" stops being useful. */
function fmtWhen(iso: string) {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return "—"
  const mins = Math.round((Date.now() - then.getTime()) / 60000)
  if (mins < 1)    return "just now"
  if (mins < 60)   return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24)    return `${hrs} hour${hrs === 1 ? "" : "s"} ago`
  const days = Math.round(hrs / 24)
  if (days <= 7)   return `${days} day${days === 1 ? "" : "s"} ago`
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/** Date only, for account facts. Empty string means the value never loaded,
 *  which is different from a date we have and should not be dressed up. */
function fmtDay(iso: string | null | undefined) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/** Icon + label on the left, value hard right — the rail's list row. */
function RailLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#F0EFFA] py-2.5 last:border-none">
      <dt className="flex items-center gap-2 text-[13px] text-[#69708A]">
        <span className="shrink-0 text-[#8A90A6]">{icon}</span>
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right text-[13px] font-bold text-[#171C35]">{value}</dd>
    </div>
  )
}

/** Label-over-value, the console's Fact. */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">{label}</dt>
      <dd className="mt-1 text-[14px] font-bold text-[#171C35] break-words">{value}</dd>
    </div>
  )
}

/** Icon chip beside a label/value, for contact details. */
function ContactTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-[#DFE2ED] bg-[#FAFAFF] px-4 py-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-white text-[#6655DF] ring-1 ring-[#DFE2ED]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">{label}</p>
        <p className="mt-0.5 text-[14px] font-bold text-[#171C35] break-words">{value}</p>
      </div>
    </div>
  )
}

/** How much of the optional profile is filled in, as a ring. */
function CompletenessRing({ value }: { value: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3.5">
      <svg viewBox="0 0 90 90" className="h-22 w-22 shrink-0" role="img" aria-label={`Profile ${value}% complete`}>
        <circle cx="45" cy="45" r={r} fill="none" stroke="#F0EFFA" strokeWidth="9" />
        <circle
          cx="45" cy="45" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
          stroke={value >= 80 ? "#0ca30c" : "#6655DF"}
          strokeDasharray={`${(c * value) / 100} ${c}`}
          transform="rotate(-90 45 45)"
        />
        <text x="45" y="50" textAnchor="middle" fontSize="17" fontWeight="800" fill="#171C35">{value}%</text>
      </svg>
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-[#171C35]">Profile complete</p>
        <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">Optional details included</p>
      </div>
    </div>
  )
}

/** Animated aurora backdrop for the settings banner. CSS gradients and a slow
 *  transform rather than a GIF: no asset to ship, sharp at any size, and it
 *  honours prefers-reduced-motion for free via the motion-safe variant. */
const AURORA =
  "[background-image:radial-gradient(60%_80%_at_15%_20%,rgba(168,139,255,0.55),transparent_60%)," +
  "radial-gradient(50%_70%_at_85%_30%,rgba(97,196,255,0.45),transparent_60%)," +
  "radial-gradient(60%_90%_at_60%_100%,rgba(255,170,120,0.35),transparent_60%)]"

/** Faint dot grid, the texture most SaaS settings pages use behind a hero. */
const DOTS =
  "[background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:18px_18px]"

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile,  setProfile]  = useState<AccountProfile | null>(null)
  const [role,     setRole]     = useState<Role>("USER")
  // Operators get the account-record view; learners get the profile view.
  // Instructors count as operators: they author material others consume.
  const isOperator = role === "ADMIN" || role === "INSTRUCTOR"
  const [loading,  setLoading]  = useState(true)
  const [avatar,   setAvatar]   = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [sessions, setSessions]               = useState<DeviceSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError]     = useState<string | null>(null)
  // False until the user_sessions migration has been applied.
  const [sessionsReady, setSessionsReady]     = useState(true)
  const [revokingId, setRevokingId]           = useState<string | null>(null)
  const [revokingOthers, setRevokingOthers]   = useState(false)
  const otherSessions = sessions.filter(sn => !sn.current).length
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { startUpload } = useUploadThing("imageUploader")

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // Profile form
  const profileForm = useForm<ProfileValues>({
    resolver:      yupResolver(profileSchema) as Resolver<ProfileValues>,
    defaultValues: {
      firstName: "", lastName: "", phoneCountryCode: "+234", phone: "",
      country: "", jobTitle: "", organisation: "", bio: "", dateOfBirth: "",
    },
  })

  // Password form
  const passwordForm = useForm<PasswordValues>({
    resolver: yupResolver(passwordSchema) as Resolver<PasswordValues>,
  })

  // Contact information form
  const contactInfoForm = useForm<ContactInfoValues>({
    resolver:      yupResolver(contactInfoSchema) as Resolver<ContactInfoValues>,
    defaultValues: { addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "" },
  })

  // Configuration form
  const configForm = useForm<ConfigValues>({
    resolver:      yupResolver(configSchema) as Resolver<ConfigValues>,
    defaultValues: { language: "", timezone: "", emailOptIn: true },
  })

  // Load profile
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [profileRes, meRes] = await Promise.all([
          fetch("/api/account/profile"),
          fetch("/api/auth/me"),
        ])
        if (cancelled) return

        let me: { role?: Role; firstName?: string | null; lastName?: string | null; email?: string } | null = null
        if (meRes.ok) {
          me = await meRes.json()
          if (me?.role) setRole(me.role as Role)
        }

        if (profileRes.ok) {
          const data = (await profileRes.json()) as AccountProfile
          setProfile(data)
          setAvatar(data.avatar)
          const { code: phoneCode, number: phoneNumber } = splitPhone(data.phone)
          profileForm.reset({
            firstName:        data.firstName    ?? me?.firstName ?? "",
            lastName:         data.lastName     ?? me?.lastName  ?? "",
            phoneCountryCode: phoneCode,
            phone:            phoneNumber,
            country:          data.country      ?? "",
            jobTitle:         data.jobTitle     ?? "",
            organisation:     data.organisation ?? "",
            bio:              data.bio          ?? "",
            dateOfBirth:      data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
          })
          contactInfoForm.reset({
            addressLine1: data.addressLine1 ?? "",
            addressLine2: data.addressLine2 ?? "",
            city:         data.city         ?? "",
            state:        data.state        ?? "",
            postalCode:   data.postalCode   ?? "",
          })
          configForm.reset({
            language:   data.language ?? "",
            timezone:   data.timezone ?? "",
            emailOptIn: data.emailOptIn,
          })
        } else if (me) {
          profileForm.reset({
            firstName:        me.firstName ?? "",
            lastName:         me.lastName  ?? "",
            phoneCountryCode: "+234",
            phone:            "",
            country:          "",
            jobTitle:         "",
            organisation:     "",
            bio:              "",
            dateOfBirth:      "",
          })
          if (me.email) {
            setProfile({
              email:        me.email,
              firstName:    me.firstName ?? null,
              lastName:     me.lastName  ?? null,
              avatar:       null,
              bio:          null,
              phone:        null,
              country:      null,
              jobTitle:     null,
              organisation: null,
              addressLine1: null,
              addressLine2: null,
              city:         null,
              state:        null,
              postalCode:   null,
              dateOfBirth:  null,
              language:     null,
              timezone:     null,
              emailOptIn:   true,
              // This branch only runs when the profile endpoint failed, so the
              // account facts are genuinely unknown rather than empty. The UI
              // reads them as "—" instead of asserting anything.
              role:          me.role ?? "USER",
              status:        "",
              emailVerified: false,
              createdAt:     "",
              providers:     [],
            })
          }
        }
      } catch {
        showToast("Could not load your account details.", false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [profileForm, contactInfoForm, configForm])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await startUpload([file])
      const url = res?.[0]?.url ?? null
      if (!url) {
        showToast("Upload failed. Please try a different image.", false)
        return
      }
      setAvatar(url)
      const resp = await fetch("/api/account/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ avatar: url }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        showToast(err.error ?? "Could not save avatar.", false)
        return
      }
      showToast("Profile photo updated.")
    } finally {
      setUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ""
    }
  }

  async function handleRemoveAvatar() {
    setAvatar(null)
    const resp = await fetch("/api/account/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ avatar: null }),
    })
    if (!resp.ok) {
      showToast("Could not remove avatar.", false)
      return
    }
    showToast("Profile photo removed.")
  }

  async function onSaveProfile(data: ProfileValues) {
    const combinedPhone = combinePhone(data.phoneCountryCode, data.phone)
    const payload = {
      firstName:    data.firstName,
      lastName:     data.lastName,
      phone:        combinedPhone   || null,
      country:      data.country      || null,
      jobTitle:     data.jobTitle     || null,
      organisation: data.organisation || null,
      bio:          data.bio          || null,
      dateOfBirth:  data.dateOfBirth  || null,
    }
    const resp = await fetch("/api/account/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      showToast(err.error ?? "Could not save profile.", false)
      return
    }
    const updated = (await resp.json()) as AccountProfile
    setProfile(updated)
    showToast("Profile saved.")
  }

  async function onSaveContactInfo(data: ContactInfoValues) {
    const payload = {
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      city:         data.city         || null,
      state:        data.state        || null,
      postalCode:   data.postalCode   || null,
    }
    const resp = await fetch("/api/account/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      showToast(err.error ?? "Could not save contact information.", false)
      return
    }
    const updated = (await resp.json()) as AccountProfile
    setProfile(updated)
    showToast("Contact information saved.")
  }

  async function onSaveConfig(data: ConfigValues) {
    const payload = {
      language:   data.language || null,
      timezone:   data.timezone || null,
      emailOptIn: data.emailOptIn,
    }
    const resp = await fetch("/api/account/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      showToast(err.error ?? "Could not save configuration.", false)
      return
    }
    const updated = (await resp.json()) as AccountProfile
    setProfile(updated)
    showToast("Configuration saved.")
  }

  async function onChangePassword(data: PasswordValues) {
    const resp = await fetch("/api/account/password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      showToast(err.error ?? "Could not change password.", false)
      return
    }
    passwordForm.reset({ currentPassword: "", newPassword: "", confirmPassword: "" })
    showToast("Password updated.")
  }

  const loadSessions = useCallback(async () => {
    try {
      const resp = await fetch("/api/account/sessions")
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}))
        setSessionsError(d.error ?? "Could not load your sessions.")
        return
      }
      const data = await resp.json()
      setSessions(data.sessions ?? [])
      setSessionsReady(data.available !== false)
      setSessionsError(null)
    } catch {
      setSessionsError("Could not load your sessions.")
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  // Only operators see the sessions card, so only they pay for the request.
  useEffect(() => {
    if (!isOperator) { setSessionsLoading(false); return }
    loadSessions()
  }, [isOperator, loadSessions])

  async function revokeOne(id: string) {
    setRevokingId(id)
    try {
      const resp = await fetch(`/api/account/sessions/${id}`, { method: "DELETE" })
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}))
        showToast(d.error ?? "Could not sign that session out.", false)
        return
      }
      setSessions(prev => prev.filter(s => s.id !== id))
      showToast("That device will be signed out within 15 minutes.", true)
    } finally {
      setRevokingId(null)
    }
  }

  async function revokeOthers() {
    setRevokingOthers(true)
    try {
      const resp = await fetch("/api/account/sessions", { method: "DELETE" })
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}))
        showToast(d.error ?? "Could not sign the other sessions out.", false)
        return
      }
      const { revoked } = await resp.json()
      setSessions(prev => prev.filter(s => s.current))
      showToast(
        revoked === 0
          ? "There were no other sessions."
          : `${revoked} session${revoked === 1 ? "" : "s"} will be signed out within 15 minutes.`,
        true,
      )
    } finally {
      setRevokingOthers(false)
    }
  }

  async function handleSignOutAll() {
    const resp = await fetch("/api/auth/logout", { method: "POST" })
    if (resp.redirected) {
      window.location.href = resp.url
    } else {
      window.location.href = "/login"
    }
  }

  async function handleDeleteAccount() {
    const resp = await fetch("/api/account/delete", { method: "POST" })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      showToast(err.error ?? "Could not delete account.", false)
      setConfirmDelete(false)
      return
    }
    window.location.href = "/login"
  }

  const fullName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
    : ""

  /** Optional fields only — the ring measures how much of the record the
   *  person has chosen to fill in, not whether the account is usable. */
  const optionalFields = [
    profile?.firstName, profile?.lastName, profile?.avatar, profile?.bio,
    profile?.phone, profile?.country, profile?.jobTitle, profile?.organisation,
    profile?.addressLine1, profile?.city, profile?.timezone, profile?.language,
  ]
  const completeness = Math.round(
    (optionalFields.filter(f => f !== null && f !== undefined && f !== "").length / optionalFields.length) * 100,
  )

  const initials = profile
    ? (profile.firstName || profile.lastName)
      ? [profile.firstName, profile.lastName].filter(Boolean).map(s => s![0]?.toUpperCase()).join("")
      : profile.email[0]?.toUpperCase()
    : "?"

  if (loading) return <SettingsSkeleton />

  return (
    <div className="w-full">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 left-4 sm:left-auto z-100 px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium flex items-center gap-2",
          toast.ok
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-600 border border-red-200",
        )}>
          {toast.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="max-w-400 mx-auto">
          <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Account</span>
          <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">Settings</h1>
          <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">Your profile, contact details, security and preferences</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-10 pt-5">
        <div className="max-w-400 mx-auto">

          {/* Hero — the band is filled rather than used as a strip with the
              avatar hanging off it, so the whole card carries the identity.
              The facts that used to sit under it now live in the rail, where
              they do not compete with the editable copies below. */}
          <div className={cn("relative overflow-hidden rounded-[16px] bg-[#0E1230] px-5 sm:px-7 py-6 sm:py-7", DOTS)}>
            <div className={cn("absolute inset-0 opacity-70 blur-2xl motion-safe:animate-[pulse_9s_ease-in-out_infinite]", AURORA)} />

            <div className="relative flex flex-wrap items-center gap-4 sm:gap-5">
              <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-white ring-1 ring-white/25">
                {loading ? null : avatar ? (
                  <Image src={avatar} alt="" fill className="object-cover" />
                ) : (
                  <span className="text-[20px] font-extrabold text-[#6655DF]">{initials}</span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <span className="block text-[11px] tracking-[0.12em] uppercase font-extrabold text-white/60">Settings</span>
                <h2 className="mt-1 break-words text-[clamp(22px,2.6vw,30px)] leading-[1.1] tracking-[-0.03em] font-extrabold text-white">
                  {loading ? "…" : fullName || profile?.email.split("@")[0] || "—"}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white/85 ring-1 ring-white/15">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><polyline points="4 7 12 13 20 7"/></svg>
                    {profile?.email ?? "—"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white/85 ring-1 ring-white/15">
                    {ROLE_ICONS[role]}
                    {ROLE_LABELS[role]}
                  </span>
                  {profile?.jobTitle ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white/85 ring-1 ring-white/15">
                      {profile.jobTitle}
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="flex h-9 shrink-0 items-center gap-1.5 self-start rounded-[10px] bg-white/10 px-3.5 text-[13px] font-bold text-white ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {uploading ? "Uploading…" : avatar ? "Replace photo" : "Add photo"}
              </button>
            </div>
          </div>

          {/* Operators get the account record, not a profile to fill in:
              what this account is, and how it is secured. */}
          {isOperator && (
            <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">

              <OpsCard
                title="Profile"
                note="How you appear to other operators and on anything you author."
              >
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#DFE2ED] bg-[#FAFAFF] px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">Name</p>
                    <p className="mt-1 text-[16px] font-extrabold text-[#171C35] break-words">
                      {loading ? "…" : fullName || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingName(v => !v)}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-[#DFE2ED] bg-white px-3.5 text-[13px] font-bold text-[#171C35] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {editingName ? "Close" : "Edit name"}
                  </button>
                </div>

                {editingName && (
                  <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>First name</label>
                        <input {...profileForm.register("firstName")} className={inputCls} disabled={loading} />
                        {profileForm.formState.errors.firstName && (
                          <p className="text-[11px] text-red-500 mt-1">{profileForm.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Last name</label>
                        <input {...profileForm.register("lastName")} className={inputCls} disabled={loading} />
                        {profileForm.formState.errors.lastName && (
                          <p className="text-[11px] text-red-500 mt-1">{profileForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={profileForm.formState.isSubmitting || loading}
                        className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {profileForm.formState.isSubmitting ? "Saving…" : "Save name"}
                      </button>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {uploading ? "Uploading…" : avatar ? "Replace photo" : "Add photo"}
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                  </form>
                )}

                <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                  <OpsFact label="Email" value={profile?.email ?? "—"} />
                  <OpsFact label="Role" value={ROLE_LABELS[role]} />
                  <OpsFact label="Joined" value={fmtDay(profile?.createdAt)} />
                  <OpsFact
                    label="Sign-in method"
                    value={
                      profile?.providers?.length
                        ? profile.providers.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")
                        : "Password"
                    }
                  />
                  <OpsFact
                    label="Email verified"
                    value={profile?.emailVerified
                      ? <span className="text-emerald-700">Yes</span>
                      : <span className="text-amber-700">Not verified</span>}
                  />
                  <OpsFact
                    label="Account status"
                    value={profile?.status
                      ? profile.status.charAt(0) + profile.status.slice(1).toLowerCase()
                      : "—"}
                  />
                </dl>

                <div className="mt-5 border-t border-dashed border-[#DFE2ED] pt-4">
                  <p className="text-[12.5px] leading-relaxed text-[#8A90A6]">
                    Your email is your sign-in and can&apos;t be changed here. Roles are set by an administrator
                    under Users.
                  </p>
                </div>
              </OpsCard>

              <div className="min-w-0 space-y-5">
                <OpsCard
                  title="Password"
                  note="Use a long passphrase you don't use anywhere else."
                >
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">

                    <PasswordInput
                      label="Current password"
                      inputClassName={inputCls}
                      autoComplete="current-password"
                      error={passwordForm.formState.errors.currentPassword?.message}
                      {...passwordForm.register("currentPassword")}
                    />

                    <div className="grid grid-cols-1 gap-3">
                      <PasswordInput
                        label="New password"
                        inputClassName={inputCls}
                        autoComplete="new-password"
                        error={passwordForm.formState.errors.newPassword?.message}
                        {...passwordForm.register("newPassword")}
                      />
                      <PasswordInput
                        label="Confirm new password"
                        inputClassName={inputCls}
                        autoComplete="new-password"
                        error={passwordForm.formState.errors.confirmPassword?.message}
                        {...passwordForm.register("confirmPassword")}
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={passwordForm.formState.isSubmitting}
                        className="w-full px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {passwordForm.formState.isSubmitting ? "Updating…" : "Update password"}
                      </button>
                    </div>
                  </form>
                  <p className="mt-4 border-t border-dashed border-[#DFE2ED] pt-4 text-[12.5px] text-[#8A90A6]">
                    Changing it does not end your other sessions — use the Sessions card below for that.
                  </p>
                </OpsCard>

                {/* Sessions — real rows from user_sessions, not a stand-in.
                    A revoked device keeps its unexpired access token until it
                    runs out, so the copy promises "within 15 minutes" rather
                    than an instant kill. */}
                <OpsCard
                  title="Sessions"
                  note="Browsers and devices signed in to your account."
                >
                  {sessionsLoading ? (
                    <InlineSkeleton rows={2} />
                  ) : sessionsError ? (
                    <p className="text-[13px] text-amber-700">{sessionsError}</p>
                  ) : !sessionsReady ? (
                    <div className="rounded-[12px] border border-dashed border-[#DFE2ED] px-4 py-5">
                      <p className="text-[13.5px] font-bold text-[#171C35]">Session tracking isn&apos;t set up yet</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#69708A]">
                        The <code className="font-mono text-[12.5px]">user_sessions</code> table has not been created,
                        so there is nothing to list. Run the migration, then restart the dev server:
                      </p>
                      <pre className="mt-2.5 overflow-x-auto rounded-[9px] bg-[#F5F6FB] px-3 py-2.5 text-[12px] leading-relaxed text-[#171C35]">
npm run db:exec -- prisma/manual-migrations/add_user_sessions.sql{"\n"}npx prisma generate</pre>
                      <p className="mt-2.5 text-[12.5px] text-[#8A90A6]">
                        Signing in still works meanwhile — session records are written only when the table exists.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[14px] font-extrabold text-[#171C35]">
                        {sessions.length} active session{sessions.length === 1 ? "" : "s"}
                      </p>
                      <p className="mt-0.5 text-[13px] text-[#69708A]">
                        {otherSessions === 0
                          ? "Just this one."
                          : `This one, plus ${otherSessions} other${otherSessions === 1 ? "" : "s"}.`}
                        {" "}Signing a device out takes effect within 15 minutes.
                      </p>

                      <ul className="mt-4 space-y-2.5">
                        {sessions.map(sn => (
                          <li
                            key={sn.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#DFE2ED] bg-[#FAFAFF] px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-[#171C35]">
                                {sn.browser} on {sn.os}
                                {sn.current && (
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase font-extrabold text-emerald-700">
                                    This device
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 text-[12px] text-[#8A90A6]">
                                {sn.ipAddress ?? "IP unknown"} · last active {fmtWhen(sn.lastSeenAt)}
                              </p>
                            </div>
                            {!sn.current && (
                              <button
                                type="button"
                                disabled={revokingId === sn.id}
                                onClick={() => revokeOne(sn.id)}
                                className="shrink-0 rounded-[9px] border border-[#DFE2ED] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#69708A] hover:border-red-300 hover:text-red-600 disabled:opacity-50 cursor-pointer transition-colors"
                              >
                                {revokingId === sn.id ? "Signing out…" : "Sign out"}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[#DFE2ED] pt-4">
                        <button
                          type="button"
                          disabled={otherSessions === 0 || revokingOthers}
                          onClick={revokeOthers}
                          className="rounded-[10px] border border-[#DFE2ED] bg-white px-4 py-2 text-[13px] font-semibold text-[#171C35] hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer transition-colors"
                        >
                          {revokingOthers ? "Signing out…" : "Sign out other sessions"}
                        </button>
                        <button
                          type="button"
                          onClick={handleSignOutAll}
                          className="rounded-[10px] px-4 py-2 text-[13px] font-semibold text-[#69708A] hover:text-red-600 cursor-pointer transition-colors"
                        >
                          Sign out this device
                        </button>
                      </div>
                    </>
                  )}
                </OpsCard>
              </div>
            </div>
          )}


          {/* Learner view — two columns from xl: everything editable on the
              left, a rail on the right. Below xl it collapses to one column,
              rail last. */}
          {!isOperator && (
            <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
              <div className="min-w-0 space-y-5">

                {/* One column of cards: the rail on the right took the width
                    the old side-by-side pair used to have. */}
                  <Section
                    id="settings-profile"
                    icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                    eyebrow="Your record"
                    title="How you appear across the platform"
                    note="These details show on your certificates, on discussion posts and to the facilitators of anything you enrol in."
                  >
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                      <Fact label="Full name"    value={dash(fullName)} />
                      <Fact label="Email"        value={profile?.email ?? "—"} />
                      <Fact label="Role"         value={ROLE_LABELS[role]} />
                      <Fact label="Job title"    value={dash(profile?.jobTitle)} />
                      <Fact label="Organisation" value={dash(profile?.organisation)} />
                      <Fact label="Language"     value={dash(profile?.language)} />
                    </dl>
                    {profile?.bio ? (
                      <blockquote className="mt-5 border-l-2 border-[#6655DF] pl-4 text-[14px] leading-relaxed text-[#69708A] italic">
                        {profile.bio}
                      </blockquote>
                    ) : null}
                  </Section>

                  <Section
                    icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><polyline points="4 7 12 13 20 7"/></svg>}
                    eyebrow="Reach you"
                    title="Where we send things"
                    note="Receipts, certificates and account notices go here."
                  >
                    <div className="grid gap-2.5">
                      <ContactTile
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><polyline points="4 7 12 13 20 7"/></svg>}
                        label="Email" value={profile?.email ?? "—"}
                      />
                      <ContactTile
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.26-1.26a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>}
                        label="Phone" value={dash(profile?.phone)}
                      />
                      <ContactTile
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>}
                        label="Location"
                        value={[profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ") || "—"}
                      />
                    </div>
                  </Section>

                <Section
                  eyebrow="Your details"
                  title="Edit your profile"
                  note="Your photo, name and bio. Everything here is optional except the name."
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                >
                {/* Avatar */}
                <div className="flex items-center gap-4 flex-wrap pb-4 border-b border-[#F0EFFA]">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border border-[#DFE2ED] bg-[#F5F6FB] shrink-0">
                    {avatar ? (
                      <Image src={avatar} alt="Avatar" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-heading text-[1.25rem] font-semibold text-[#6655DF]">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploading}
                        className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {uploading ? "Uploading…" : avatar ? "Replace photo" : "Upload photo"}
                      </button>
                      {avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:border-red-300 hover:text-red-600 cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8A90A6]">JPG, PNG or WEBP. Max 4 MB.</p>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>First name</label>
                      <input {...profileForm.register("firstName")} className={inputCls} placeholder="Jane" readOnly />
                      {profileForm.formState.errors.firstName && (
                        <p className="text-[11px] text-red-500 mt-1">{profileForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Last name</label>
                      <input {...profileForm.register("lastName")} className={inputCls} placeholder="Doe" readOnly />
                      {profileForm.formState.errors.lastName && (
                        <p className="text-[11px] text-red-500 mt-1">{profileForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Phone</label>
                      <div className="flex">
                        <Controller
                          control={profileForm.control}
                          name="phoneCountryCode"
                          render={({ field }) => (
                            <PhoneCodeSelect
                              value={field.value || "+234"}
                              onChange={field.onChange}
                              disabled={loading}
                            />
                          )}
                        />
                        <input
                          {...profileForm.register("phone")}
                          className={`${inputCls} rounded-l-none min-w-0`}
                          placeholder="800 000 0000"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input value={profile?.email ?? ""} readOnly className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Date of birth</label>
                      <Controller
                        control={profileForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <DatePicker
                            label="Date of birth"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={loading}
                            placeholder="Select your date of birth"
                            /* Nobody signing up here was born before 1920, and
                               a birth date cannot be in the future. */
                            fromYear={1920}
                            toYear={new Date().getFullYear()}
                            max={toISODate(new Date())}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Job title</label>
                      <input {...profileForm.register("jobTitle")} className={inputCls} placeholder="Senior Researcher" disabled={loading} />
                    </div>
                    <div>
                      <label className={labelCls}>Organisation</label>
                      <input {...profileForm.register("organisation")} className={inputCls} placeholder="ARPS Institute" disabled={loading} />
                    </div>
                    <div>
                      <label className={labelCls}>Country</label>
                      <input {...profileForm.register("country")} className={inputCls} placeholder="Nigeria" disabled={loading} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Bio</label>
                    <textarea
                      {...profileForm.register("bio")}
                      className={`${inputCls} min-h-24 resize-y`}
                      placeholder="A short introduction about yourself"
                      disabled={loading}
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="text-[11px] text-red-500 mt-1">{profileForm.formState.errors.bio.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting || loading}
                      className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {profileForm.formState.isSubmitting ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </form>
                </Section>

                <Section
                  id="settings-contact"
                  eyebrow="Contact"
                  title="Your postal address"
                  note="Where anything physical goes, and what we quote on invoices."
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>}
                >
                  <form onSubmit={contactInfoForm.handleSubmit(onSaveContactInfo)} className="space-y-4">
                    <div>
                      <label className={labelCls}>Address line 1</label>
                      <input {...contactInfoForm.register("addressLine1")} className={inputCls} placeholder="123 Main Street" disabled={loading} />
                    </div>
                    <div>
                      <label className={labelCls}>Address line 2</label>
                      <input {...contactInfoForm.register("addressLine2")} className={inputCls} placeholder="Apt, suite, floor (optional)" disabled={loading} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>City</label>
                        <input {...contactInfoForm.register("city")} className={inputCls} placeholder="Lagos" disabled={loading} />
                      </div>
                      <div>
                        <label className={labelCls}>State / Province</label>
                        <input {...contactInfoForm.register("state")} className={inputCls} placeholder="Lagos State" disabled={loading} />
                      </div>
                      <div>
                        <label className={labelCls}>Postal code</label>
                        <input {...contactInfoForm.register("postalCode")} className={inputCls} placeholder="100001" disabled={loading} />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={contactInfoForm.formState.isSubmitting || loading}
                        className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {contactInfoForm.formState.isSubmitting ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </form>
                </Section>

                <Section
                  id="settings-preferences"
                  eyebrow="Preferences"
                  title="How the app behaves"
                  note="Language, timezone and what we are allowed to email you about."
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9z"/></svg>}
                >
                  <form onSubmit={configForm.handleSubmit(onSaveConfig)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Language</label>
                        <select {...configForm.register("language")} className={inputCls} disabled={loading}>
                          <option value="">Select language…</option>
                          {LANGUAGE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Timezone</label>
                        <select {...configForm.register("timezone")} className={inputCls} disabled={loading}>
                          <option value="">Auto-detect from device</option>
                          {TIMEZONE_OPTIONS.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#F0EFFA]">
                      <div className="min-w-0">
                        <p className="font-semibold text-[13px] text-[#171C35]">Email notifications</p>
                        <p className="text-[12px] text-[#8A90A6] mt-0.5">Receive product updates, course announcements and research highlights.</p>
                      </div>
                      <Controller
                        name="emailOptIn"
                        control={configForm.control}
                        render={({ field }) => (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={field.value}
                            onClick={() => field.onChange(!field.value)}
                            disabled={loading}
                            className={cn(
                              "relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 disabled:opacity-50",
                              field.value ? "bg-[#6655DF]" : "bg-[#DFE2ED]",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                                field.value ? "left-5" : "left-0.5",
                              )}
                            />
                          </button>
                        )}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={configForm.formState.isSubmitting || loading}
                        className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {configForm.formState.isSubmitting ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </form>
                </Section>

                <Section
                  eyebrow="Billing"
                  title="Payments and invoices"
                  note="Receipts for anything you have paid for on the platform."
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
                >
                  <div className="flex flex-col items-center text-center py-10 px-4">
                    <div className="w-14 h-14 rounded-full bg-[#F5F6FB] flex items-center justify-center mb-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A90A6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="14" rx="2"/>
                        <line x1="2" y1="10" x2="22" y2="10"/>
                        <line x1="6" y1="15" x2="10" y2="15"/>
                      </svg>
                    </div>
                    <h3 className="font-heading text-[14px] font-semibold text-[#171C35]">No billing on file</h3>
                    <p className="text-[12px] text-[#8A90A6] mt-1 max-w-sm">
                      When you purchase a program or workshop, your receipts and payment methods will appear here.
                    </p>
                  </div>
                </Section>

                  {/* Danger zone */}
                  <section className="mt-5 rounded-[16px] border border-red-200 bg-white overflow-hidden">
                <header className="px-4 sm:px-5 py-4 border-b border-red-100 bg-red-50/60">
                  <h2 className="font-heading text-[14px] font-semibold text-red-700">Danger zone</h2>
                  <p className="text-[12px] text-red-500/80 mt-0.5">Sensitive actions that affect access to your account.</p>
                </header>

                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#F0EFFA]">
                    <div className="min-w-0">
                      <p className="font-semibold text-[13px] text-[#171C35]">Sign out</p>
                      <p className="text-[12px] text-[#8A90A6] mt-0.5">End the current session and return to the login page.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOutAll}
                      className="self-start sm:self-auto px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer transition-colors"
                    >
                      Sign out
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[13px] text-[#171C35]">Delete account</p>
                      <p className="text-[12px] text-[#8A90A6] mt-0.5">Disables your account immediately. Contact support to restore access.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="self-start sm:self-auto px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer transition-colors"
                    >
                      Delete account
                    </button>
                  </div>
                    </div>
                  </section>
              </div>


              {/* Rail — who you are, the one security action, and where to go
                  for everything this screen cannot change. Sticky from xl, so
                  it stays put while the left column scrolls. */}
              <aside className="min-w-0 space-y-5 xl:sticky xl:top-6 xl:self-start">

                <section className="rounded-[16px] border border-[#DFE2ED] bg-white p-5">
                  <div className="flex items-center gap-3.5">
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#EEECFF]">
                      {avatar
                        ? <Image src={avatar} alt="" fill className="object-cover" />
                        : <span className="text-[15px] font-extrabold text-[#6655DF]">{initials}</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] leading-[1.25] tracking-[-0.02em] font-extrabold text-[#171C35] break-words">
                        {loading ? "…" : fullName || profile?.email.split("@")[0] || "—"}
                      </p>
                      <p className="mt-0.5 text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">
                        {ROLE_LABELS[role]}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4">
                    <RailLine
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><polyline points="4 7 12 13 20 7"/></svg>}
                      label="Work email" value={profile?.email ?? "—"}
                    />
                    <RailLine
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
                      label="Organisation" value={dash(profile?.organisation)}
                    />
                    <RailLine
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                      label="Country" value={dash(profile?.country)}
                    />
                    <RailLine
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                      label="Timezone" value={dash(profile?.timezone)}
                    />
                  </dl>

                  <div className="mt-4 border-t border-dashed border-[#DFE2ED] pt-4">
                    <CompletenessRing value={completeness} />
                  </div>
                </section>

                <section className="rounded-[16px] border border-[#DFE2ED] bg-white p-5">
                  <h2 className="text-[17px] leading-[1.25] tracking-[-0.02em] font-extrabold text-[#171C35]">Change password</h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#69708A]">
                    Confirm your current password to set a new one. Use at least 8 characters with an uppercase letter and a number.
                  </p>
                  <div className="mt-4">
                    <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">

                      <PasswordInput
                        label="Current password"
                        inputClassName={inputCls}
                        autoComplete="current-password"
                        error={passwordForm.formState.errors.currentPassword?.message}
                        {...passwordForm.register("currentPassword")}
                      />

                      <div className="grid grid-cols-1 gap-3">
                        <PasswordInput
                          label="New password"
                          inputClassName={inputCls}
                          autoComplete="new-password"
                          error={passwordForm.formState.errors.newPassword?.message}
                          {...passwordForm.register("newPassword")}
                        />
                        <PasswordInput
                          label="Confirm new password"
                          inputClassName={inputCls}
                          autoComplete="new-password"
                          error={passwordForm.formState.errors.confirmPassword?.message}
                          {...passwordForm.register("confirmPassword")}
                        />
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={passwordForm.formState.isSubmitting}
                          className="w-full px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {passwordForm.formState.isSubmitting ? "Updating…" : "Update password"}
                        </button>
                      </div>
                    </form>
                  </div>
                </section>

                {/* Dashed, because nothing in it is editable here — these are
                    pointers to where the change actually happens. */}
                <section className="rounded-[16px] border border-dashed border-[#DFE2ED] bg-white p-5">
                  <h2 className="text-[15px] font-extrabold text-[#171C35]">Need a change?</h2>
                  <div className="mt-3 -mx-1.5">
                    {[
                      { label: "Your name, photo and bio", target: "settings-profile" },
                      { label: "Email, phone and address", target: "settings-contact" },
                      { label: "Language, timezone and email opt-in", target: "settings-preferences" },
                    ].map(item => (
                      <button
                        key={item.target}
                        type="button"
                        onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="flex w-full items-center justify-between gap-3 rounded-[9px] px-1.5 py-2 text-left text-[13.5px] text-[#171C35] hover:bg-[#F5F6FB] cursor-pointer transition-colors"
                      >
                        {item.label}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A90A6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[12px] text-[#8A90A6]">
                    Your role is set by an administrator and cannot be changed here.
                  </p>
                </section>
              </aside>

            </div>
          )}

        </div>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-[#171C35]/50 backdrop-blur-[2px] px-4"
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(false) }}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden">
            <div className="bg-red-600 p-5">
              <div className="font-heading text-[1.125rem] font-medium text-white">Delete your account?</div>
              <div className="font-body text-[12px] text-white/85 mt-0.5">
                You will be signed out and your account will be disabled. You can contact support to restore access.
              </div>
            </div>
            <div className="px-5 py-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Yes, delete my account
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="w-full px-4 py-2 text-[13px] font-medium text-[#69708A] hover:text-[#171C35] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
