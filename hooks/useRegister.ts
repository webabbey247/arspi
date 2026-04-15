"use client"

import { useState } from "react"

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false)

  async function register(payload: {
    email: string
    password: string
  }): Promise<Result<{ userId: string }>> {
    setIsLoading(true)
    try {
      const res = await fetch("/api/basic-information", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error ?? "Registration failed." }
      return { success: true, data: { userId: data.userId } }
    } catch {
      return { success: false, error: "Something went wrong. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  return { register, isLoading }
}
