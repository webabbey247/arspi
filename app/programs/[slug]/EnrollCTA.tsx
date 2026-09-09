"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

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
  const router = useRouter()

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

  return (
    <Button onClick={handleEnroll} disabled={loading} className={className}>
      {loading ? "Please wait…" : children}
    </Button>
  )
}
