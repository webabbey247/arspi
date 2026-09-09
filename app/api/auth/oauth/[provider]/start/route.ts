import { NextRequest, NextResponse } from "next/server"
import { generateState, generateCodeVerifier } from "arctic"
import { getOAuthProviders, isOAuthProvider } from "@/lib/oauth/providers"
import { writeHandshakeCookies } from "@/lib/oauth/handshake"

type Context = { params: Promise<{ provider: string }> }

/** GET /api/auth/oauth/[provider]/start — kicks off the OAuth handshake with
 *  a real top-level redirect to the provider's consent screen. Must be
 *  navigated to (an <a href>), not fetched — the provider needs to see the
 *  browser's own request. */
export async function GET(req: NextRequest, { params }: Context) {
  const { provider } = await params
  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url))
  }

  let config
  try {
    config = getOAuthProviders()[provider]
  } catch (error) {
    console.error(`[GET /api/auth/oauth/${provider}/start] provider not configured`, error)
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url))
  }

  const state = generateState()
  const nonce = generateState() // reuses the same opaque-random-string generator
  const codeVerifier = config.usesPkce ? generateCodeVerifier() : null

  await writeHandshakeCookies({ state, nonce, codeVerifier })

  const url = config.createAuthorizationURL(state, codeVerifier)
  url.searchParams.set("nonce", nonce)

  return NextResponse.redirect(url)
}
