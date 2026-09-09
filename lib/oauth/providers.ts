import "server-only"
import { Google, LinkedIn, decodeIdToken } from "arctic"
import { z } from "zod"

export type OAuthProviderName = "google" | "linkedin"

export type OAuthProfile = {
  providerAccountId: string
  email:             string
  emailVerified:     boolean
  firstName:         string | null
  lastName:          string | null
}

type ProviderConfig = {
  usesPkce: boolean
  createAuthorizationURL: (state: string, codeVerifier: string | null) => URL
  /** Exchanges the auth code for tokens and returns the id_token. */
  exchangeCode: (code: string, codeVerifier: string | null) => Promise<string>
  /** Decodes an id_token, checks its `nonce` claim against the one this app
   *  generated for the request, and returns a normalized profile. Throws on
   *  a nonce mismatch or a malformed/unexpected claims shape. */
  getProfile: (idToken: string, expectedNonce: string) => OAuthProfile
}

const BASE_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const SCOPES = ["openid", "profile", "email"]

// The `email_verified` claim is spec'd as a boolean, but some providers'
// implementations have shipped it as the string "true"/"false" — coerce
// either form rather than silently failing validation.
const oidcClaimsSchema = z.object({
  sub:            z.string(),
  nonce:          z.string(),
  email:          z.string().check(z.email()),
  email_verified: z.preprocess(v => v === true || v === "true", z.boolean()),
  given_name:     z.string().nullable().optional(),
  family_name:    z.string().nullable().optional(),
  name:           z.string().nullable().optional(),
})

function toProfile(claims: z.infer<typeof oidcClaimsSchema>): OAuthProfile {
  // Fall back to splitting the full `name` claim when a provider doesn't
  // send given_name/family_name separately.
  const [nameFirst, ...nameRest] = (claims.name ?? "").trim().split(/\s+/).filter(Boolean)
  return {
    providerAccountId: claims.sub,
    email:             claims.email.toLowerCase(),
    emailVerified:     claims.email_verified,
    firstName:         claims.given_name ?? nameFirst ?? null,
    lastName:          claims.family_name ?? (nameRest.length ? nameRest.join(" ") : null),
  }
}

function getProfile(idToken: string, expectedNonce: string): OAuthProfile {
  const claims = oidcClaimsSchema.parse(decodeIdToken(idToken))
  if (claims.nonce !== expectedNonce) {
    throw new Error("OAuth id_token nonce mismatch — possible replay.")
  }
  return toProfile(claims)
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} environment variable.`)
  return value
}

let cache: Record<OAuthProviderName, ProviderConfig> | undefined

/** Lazily built so a missing client id/secret only throws when a provider is
 *  actually used, not at import/build time (mirrors lib/anthropic.ts, lib/openai.ts). */
export function getOAuthProviders(): Record<OAuthProviderName, ProviderConfig> {
  if (cache) return cache

  const google = new Google(
    requireEnv("GOOGLE_CLIENT_ID"),
    requireEnv("GOOGLE_CLIENT_SECRET"),
    `${BASE_URL}/api/auth/oauth/google/callback`,
  )
  const linkedin = new LinkedIn(
    requireEnv("LINKEDIN_CLIENT_ID"),
    requireEnv("LINKEDIN_CLIENT_SECRET"),
    `${BASE_URL}/api/auth/oauth/linkedin/callback`,
  )

  return (cache = {
    google: {
      usesPkce: true,
      createAuthorizationURL: (state, codeVerifier) => google.createAuthorizationURL(state, codeVerifier!, SCOPES),
      exchangeCode: async (code, codeVerifier) => (await google.validateAuthorizationCode(code, codeVerifier!)).idToken(),
      getProfile,
    },
    linkedin: {
      usesPkce: false,
      createAuthorizationURL: state => linkedin.createAuthorizationURL(state, SCOPES),
      exchangeCode: async code => (await linkedin.validateAuthorizationCode(code)).idToken(),
      getProfile,
    },
  })
}

export function isOAuthProvider(value: string): value is OAuthProviderName {
  return value === "google" || value === "linkedin"
}
