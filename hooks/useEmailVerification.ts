"use client"

import { useState } from "react"

type Result =
  | { success: true }
  | { success: false; error: string }

export function useEmailVerification() {
  const [isLoading, setIsLoading] = useState(false)

  async function verifyEmail(token: string): Promise<Result> {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/verify-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { success: false, error: data.error ?? "Email verification failed." }
      }

      return { success: true }
    } catch {
      return { success: false, error: "Something went wrong. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  async function resendVerification(email: string): Promise<Result> {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { success: false, error: data.error ?? "Failed to resend verification email." }
      }

      return { success: true }
    } catch {
      return { success: false, error: "Something went wrong. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  return { verifyEmail, resendVerification, isLoading }
}
