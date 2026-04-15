"use client"

import { useState } from "react"

type InterestsPayload = {
  userId:          string
  interests:       string[]
  referralSource?: string
  emailOptIn?:     boolean
}

type Result =
  | { success: true }
  | { success: false; error: string }

export function useInterests() {
  const [isLoading, setIsLoading] = useState(false)

  async function saveInterests(payload: InterestsPayload): Promise<Result> {
    setIsLoading(true)
    try {
      const res = await fetch("/api/learning-interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error ?? "Failed to save interests." }
      return { success: true }
    } catch {
      return { success: false, error: "Something went wrong. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  return { saveInterests, isLoading }
}
