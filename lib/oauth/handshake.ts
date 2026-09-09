import "server-only"
import { cookies } from "next/headers"

/** Short-lived, single-use cookies for the OAuth round trip — scoped to the
 *  oauth path prefix so they're never sent on ordinary requests. */

const HANDSHAKE_PATH = "/api/auth/oauth"
const HANDSHAKE_MAX_AGE_SECONDS = 10 * 60 // long enough to complete a consent screen

const cookieOptions = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax",
  path:     HANDSHAKE_PATH,
} as const

export type HandshakeValues = { state: string; nonce: string; codeVerifier: string | null }
export type ConsumedHandshake = { state: string | null; nonce: string | null; codeVerifier: string | null }

export async function writeHandshakeCookies(values: HandshakeValues): Promise<void> {
  const jar = await cookies()
  jar.set("oauth_state", values.state, { ...cookieOptions, maxAge: HANDSHAKE_MAX_AGE_SECONDS })
  jar.set("oauth_nonce", values.nonce, { ...cookieOptions, maxAge: HANDSHAKE_MAX_AGE_SECONDS })
  if (values.codeVerifier) {
    jar.set("oauth_code_verifier", values.codeVerifier, { ...cookieOptions, maxAge: HANDSHAKE_MAX_AGE_SECONDS })
  }
}

/** Reads and immediately clears the handshake cookies — single use, whether
 *  the callback succeeds or fails. */
export async function consumeHandshakeCookies(): Promise<ConsumedHandshake> {
  const jar = await cookies()
  const state        = jar.get("oauth_state")?.value ?? null
  const nonce         = jar.get("oauth_nonce")?.value ?? null
  const codeVerifier  = jar.get("oauth_code_verifier")?.value ?? null

  jar.set("oauth_state", "", { ...cookieOptions, maxAge: 0 })
  jar.set("oauth_nonce", "", { ...cookieOptions, maxAge: 0 })
  jar.set("oauth_code_verifier", "", { ...cookieOptions, maxAge: 0 })

  return { state, nonce, codeVerifier }
}
