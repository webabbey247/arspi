"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type LoginPayload = {
  email:      string
  password:   string
  rememberMe: boolean
}

type Result =
  | { success: true }
  | { success: false; error: string }
  | { success: false; requiresVerification: true }

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function login(payload: LoginPayload): Promise<Result> {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()

      // Email not yet verified — server resent the link
      if (res.status === 403 && data.requiresVerification) {
        return { success: false, requiresVerification: true }
      }

      if (!res.ok) return { success: false, error: data.error ?? "Sign in failed." }

      // Cookie is set by the server
      const { id, role, hasProfile, hasInterests } = data.user ?? {}

      // Redirect incomplete onboarding users back to the right step
      if (!hasProfile) {
        router.push(`/register?step=2&uid=${id}`)
        return { success: true }
      }
      if (!hasInterests) {
        router.push(`/register?step=3&uid=${id}`)
        return { success: true }
      }

      // Fully onboarded — go to role dashboard
      const roleRoutes: Record<string, string> = {
        ADMIN:      "/administrator",
        INSTRUCTOR: "/instructor",
        USER:       "/student",
      }
      router.push(roleRoutes[role] ?? "/")
      router.refresh()
      return { success: true }
    } catch {
      return { success: false, error: "Something went wrong. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading }
}
