"use client"

import { useState } from "react"

type ProfilePayload = {
  userId:       string
  firstName:    string
  lastName:     string
  country?:     string
  jobTitle?:    string
  organisation?: string
  roleType?:    string
}

type Result =
  | { success: true }
  | { success: false; error: string }

export function useProfile() {
  const [isLoading, setIsLoading] = useState(false)

  async function saveProfile(payload: ProfilePayload): Promise<Result> {
    setIsLoading(true)
    try {
      const res = await fetch("/api/profile-information", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error ?? "Failed to save profile." }
      return { success: true }
    } catch {
      return { success: false, error: "Something went wrong. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  return { saveProfile, isLoading }
}
