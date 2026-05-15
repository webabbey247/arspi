let cached: Uint8Array | undefined

export function getSessionSecret(): Uint8Array {
  if (cached) return cached
  const value = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET
  if (!value) {
    throw new Error(
      "Missing NEXTAUTH_SECRET (or JWT_SECRET). Generate one with `openssl rand -base64 32` and set it in the runtime environment."
    )
  }
  return (cached = new TextEncoder().encode(value))
}
