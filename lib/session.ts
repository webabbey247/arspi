import "server-only"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { getSessionSecret } from "@/lib/auth-secret"

export type { SessionPayload } from "@/types/session"
import type { SessionPayload } from "@/types/session"

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("arspi-auth")?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/** Redirects to /login if not authenticated. */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

/** Redirects to /unauthorized if the user's role doesn't match. */
export async function requireRole(role: SessionPayload["role"]): Promise<SessionPayload> {
  const session = await requireAuth()
  if (session.role !== role) redirect("/unauthorized")
  return session
}
