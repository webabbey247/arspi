"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { isStaffRole, STAFF_ENROLMENT_MESSAGE } from "@/lib/enrolment"

/** Handles the actual "Enrol Now" action for a program: not signed in → send to
 *  login and back; free program → enrolls immediately and drops the student
 *  into the course player; paid program → redirects to Stripe Checkout.
 *  POST /api/programs/[id]/checkout does the real work — this just reacts to it. */
export default function EnrollCTA({
  programId,
  programSlug,
  className,
  children,
}: {
  programId:   string
  programSlug: string
  className?:  string
  children:    React.ReactNode
}) {
  const [loading, setLoading] = useState(false)
  // Staff cannot enrol. The server refuses it either way; this is so the
  // button says so up front instead of failing after a click.
  const [isStaff, setIsStaff] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/me")
      .then(r => (r.ok ? r.json() : null))
      .then(me => { if (!cancelled) setIsStaff(isStaffRole(me?.role)) })
      // A signed-out visitor is not staff, and a failed check must not block
      // enrolment — the server is the one that decides.
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  async function handleEnroll() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/programs/${programId}/checkout`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/programs/${programSlug}`)}`)
        return
      }
      if (res.status === 409) {
        toast.info("You're already enrolled in this programme.")
        router.push(`/student/programs/${programSlug}`)
        return
      }
      if (!res.ok) {
        toast.error(data.error ?? "Could not start enrollment. Please try again.")
        return
      }
      if (data.url) {
        window.location.href = data.url as string
        return
      }
      if (data.enrolled) {
        toast.success("You're enrolled! Taking you to the course…")
        router.push(`/student/programs/${programSlug}`)
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (isStaff) {
    return (
      <div className={className}>
        <Button disabled className="w-full cursor-not-allowed">Not available to staff</Button>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#69708A]">{STAFF_ENROLMENT_MESSAGE}</p>
      </div>
    )
  }

  return (
    <Button onClick={handleEnroll} disabled={loading} className={className}>
      {loading ? "Please wait…" : children}
    </Button>
  )
}
