import { getAuthEnv } from "@/lib/env"

let cached: Uint8Array | undefined

/** The HMAC signing key for access/refresh JWTs, as bytes for `jose`. */
export function getSessionSecret(): Uint8Array {
  if (cached) return cached
  return (cached = new TextEncoder().encode(getAuthEnv().sessionSecret))
}
