import { NextRequest, NextResponse } from "next/server"
import { getOAuthProviders, isOAuthProvider } from "@/lib/oauth/providers"
import { consumeHandshakeCookies } from "@/lib/oauth/handshake"
import { findOrCreateOAuthUser, type OAuthUser } from "@/services/oauth.service"
import { createSession } from "@/lib/session"

type Context = { params: Promise<{ provider: string }> }

/** Where a just-logged-in user lands — mirrors hooks/useLogin.ts's redirect
 *  logic exactly, since this is the server-redirect equivalent for OAuth. */
function resolveDestination(user: OAuthUser): string {
  if (!user.hasProfile) return `/register?step=2&uid=${user.id}`
  if (!user.hasInterests) return `/register?step=3&uid=${user.id}`
  const roleRoutes: Record<string, string> = {
    ADMIN:      "/administrator",
    INSTRUCTOR: "/instructor",
    USER:       "/student",
  }
  return roleRoutes[user.role] ?? "/"
}

function failure(req: NextRequest, error: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?error=${error}`, req.url))
}

/** GET /api/auth/oauth/[provider]/callback — completes the OAuth handshake:
 *  validates state/nonce, exchanges the code, finds-or-creates the user, and
 *  signs them in through the same createSession() a password login uses. */
export async function GET(req: NextRequest, { params }: Context) {
  const { provider } = await params
  const handshake = await consumeHandshakeCookies() // clear cookies regardless of outcome

  if (!isOAuthProvider(provider)) return failure(req, "oauth_failed")

  const { searchParams } = req.nextUrl
  if (searchParams.get("error")) return failure(req, "oauth_denied")

  const code = searchParams.get("code")
  const state = searchParams.get("state")
  if (!code || !state || !handshake.state || !handshake.nonce || state !== handshake.state) {
    return failure(req, "oauth_failed")
  }

  try {
    const config = getOAuthProviders()[provider]
    const idToken = await config.exchangeCode(code, handshake.codeVerifier)
    const profile = config.getProfile(idToken, handshake.nonce)

    const outcome = await findOrCreateOAuthUser(provider, profile)
    if (!outcome.success) {
      return failure(req, outcome.reason === "disabled" ? "oauth_account_disabled" : "oauth_email_unverified")
    }

    await createSession({
      sub:       outcome.user.id,
      email:     outcome.user.email,
      role:      outcome.user.role,
      firstName: outcome.user.firstName,
      lastName:  outcome.user.lastName,
    }, false)

    return NextResponse.redirect(new URL(resolveDestination(outcome.user), req.url))
  } catch (error) {
    console.error(`[GET /api/auth/oauth/${provider}/callback]`, error)
    return failure(req, "oauth_failed")
  }
}
