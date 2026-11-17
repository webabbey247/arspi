import "server-only"
import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getSessionSecret } from "@/lib/auth-secret"
import { getSession } from "@/lib/session"

/**
 * Who may write onboarding data (profile, interests) for a user.
 *
 * A freshly registered user has no session yet — they can't sign in until
 * they verify their email — so registration step 1 sets a short-lived signed
 * cookie naming the new account. Steps 2 and 3 are accepted only when that
 * cookie, or a signed-in session, belongs to the same user. Without this, the
 * userId in the request body was trusted and anyone could rewrite anyone's
 * profile (including the name printed on certificates).
 */

export const ONBOARDING_COOKIE = "arspi_onboarding"
const TTL_SECONDS = 24 * 60 * 60

function sign(payload: string) {
  return crypto
    .createHmac("sha256", Buffer.from(getSessionSecret()))
    .update(`onboarding|${payload}`) // domain-separated from other signed values
    .digest("base64url")
}

export function issueOnboardingToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS
  const payload = `${userId}.${exp}`
  return `${payload}.${sign(payload)}`
}

function verifyOnboardingToken(token: string | undefined): string | null {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [userId, exp, mac] = parts
  const expected = sign(`${userId}.${exp}`)
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  if (!/^\d+$/.test(exp) || Number(exp) < Math.floor(Date.now() / 1000)) return null
  return userId
}

/** Attaches the onboarding cookie to step 1's response. */
export function setOnboardingCookie(res: NextResponse, userId: string) {
  res.cookies.set(ONBOARDING_COOKIE, issueOnboardingToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    path:     "/api",
    maxAge:   TTL_SECONDS,
  })
}

/** True when the caller may write onboarding data for `userId`. */
export async function canOnboard(req: NextRequest, userId: string): Promise<boolean> {
  if (verifyOnboardingToken(req.cookies.get(ONBOARDING_COOKIE)?.value) === userId) return true
  const session = await getSession()
  return !!session && session.sub === userId
}
