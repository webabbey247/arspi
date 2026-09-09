import { NextRequest, NextResponse } from "next/server"
import { loginSchema } from "@/lib/validators/auth"
import { loginUser } from "@/services/auth.service"
import { sendVerificationEmail } from "@/services/email-verification.service"
import { createSession } from "@/lib/session"
import { loginRateLimitKeys, checkLoginRateLimit, recordLoginFailure, clearLoginAttempts } from "@/lib/login-rate-limit"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { email, password, rememberMe } = result.data

    const keys = loginRateLimitKeys(email, req)
    const limit = checkLoginRateLimit(keys)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      )
    }

    const outcome = await loginUser(email, password)
    if (!outcome.success) {
      // Disabled accounts prove the password was correct, so this isn't a
      // credential guess — don't count it against the lockout.
      if (outcome.reason === "disabled") {
        return NextResponse.json(
          { error: "This account has been disabled. Contact an administrator for help." },
          { status: 403 }
        )
      }
      recordLoginFailure(keys)
      // Same message for not_found/invalid_password — don't leak which is wrong
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const { user } = outcome

    // Block login until email is verified — resend link and return 403.
    // Not a credential failure, so it doesn't count against the lockout.
    if (!user.emailVerified) {
      sendVerificationEmail(user.id).catch((e) =>
        console.error("[login verify resend]", e)
      )
      return NextResponse.json({ requiresVerification: true }, { status: 403 })
    }

    clearLoginAttempts(keys)

    await createSession({
      sub:       user.id,
      email:     user.email,
      role:      user.role,
      firstName: user.firstName,
      lastName:  user.lastName,
    }, rememberMe)

    return NextResponse.json({
      user: {
        id:           user.id,
        email:        user.email,
        role:         user.role,
        firstName:    user.firstName,
        lastName:     user.lastName,
        hasProfile:   user.hasProfile,
        hasInterests: user.hasInterests,
      },
    })
  } catch (error) {
    console.error("[POST /api/auth/login]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
