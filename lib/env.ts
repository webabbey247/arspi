import "server-only"

/** Auth-related environment config, resolved once and cached. Every cookie
 *  name and login-throttle number lives here — no literal cookie names or
 *  magic numbers inline anywhere else. */

type AuthEnv = {
  sessionSecret:       string
  accessCookieName:    string
  refreshCookieName:   string
  sessionCookieName:   string
  loginMaxAttempts:    number
  loginLockoutSeconds: number
}

let cached: AuthEnv | undefined

export function getAuthEnv(): AuthEnv {
  if (cached) return cached

  const sessionSecret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET
  if (!sessionSecret) {
    throw new Error(
      "Missing SESSION_SECRET (or NEXTAUTH_SECRET / JWT_SECRET). Generate one with `openssl rand -base64 32` and set it in the runtime environment."
    )
  }

  return (cached = {
    sessionSecret,
    accessCookieName:    process.env.ACCESS_COOKIE_NAME  || "arspi-access",
    refreshCookieName:   process.env.REFRESH_COOKIE_NAME || "arspi-refresh",
    sessionCookieName:   process.env.SESSION_COOKIE_NAME || "arspi-session",
    loginMaxAttempts:    Number(process.env.LOGIN_MAX_ATTEMPTS)    || 5,
    loginLockoutSeconds: Number(process.env.LOGIN_LOCKOUT_SECONDS) || 900,
  })
}
