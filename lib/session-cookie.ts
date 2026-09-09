import "server-only"
import { sessionPayloadSchema, type SessionPayload } from "@/types/session"

/**
 * Sign/verify the session cookie with HMAC-SHA256 over Web Crypto — the
 * long-lived cookie server components read to render (name, role, email)
 * without needing to touch the short-lived access token or trigger a refresh.
 *
 * The signature stops a client editing its own role in the cookie. It is NOT
 * an authorization mechanism on its own — `lib/guard.ts` re-verifies the
 * access/refresh token for anything that mutates data. This only keeps
 * rendering honest about who's logged in.
 */

const encoder = new TextEncoder()

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="))
  // Backed by a plain ArrayBuffer so it satisfies BufferSource for Web Crypto.
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ])
}

/** Returns `<base64url(payload)>.<base64url(signature)>`. */
export async function signSessionCookie(session: SessionPayload, secret: string): Promise<string> {
  const payload = base64UrlEncode(encoder.encode(JSON.stringify(session)))
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload))
  return `${payload}.${base64UrlEncode(new Uint8Array(signature))}`
}

/** Verifies and parses a signed session cookie. Returns null on any failure —
 *  tampering, truncation, an old secret, or a shape that no longer matches the
 *  schema (which happens naturally when SessionPayload evolves). */
export async function verifySessionCookie(
  value:  string | undefined,
  secret: string,
): Promise<SessionPayload | null> {
  if (!value) return null

  const [payload, signature] = value.split(".")
  if (!payload || !signature) return null

  let valid: boolean
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      base64UrlDecode(signature),
      encoder.encode(payload),
    )
  } catch {
    return null
  }
  if (!valid) return null

  try {
    const json: unknown = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)))
    const parsed = sessionPayloadSchema.safeParse(json)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
