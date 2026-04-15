import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SignJWT } from "jose"
import { loginSchema } from "@/lib/validators/auth"
import { loginUser } from "@/services/auth.service"
import { sendVerificationEmail } from "@/services/email-verification.service"

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET ?? "dev-secret-change-in-production"
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { email, password, rememberMe } = result.data

    const outcome = await loginUser(email, password)
    if (!outcome.success) {
      // Return the same message for both cases — don't leak which is wrong
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const { user } = outcome

    // Block login until email is verified — resend link and return 403
    if (!user.emailVerified) {
      sendVerificationEmail(user.id).catch((e) =>
        console.error("[login verify resend]", e)
      )
      return NextResponse.json({ requiresVerification: true }, { status: 403 })
    }

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30d or 1d

    // Sign JWT
    const token = await new SignJWT({
      sub:       user.id,
      email:     user.email,
      role:      user.role,
      firstName: user.firstName,
      lastName:  user.lastName,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(rememberMe ? "30d" : "1d")
      .sign(secret)

    // Set httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set("arspi-auth", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge,
    })

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
