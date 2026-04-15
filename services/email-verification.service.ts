import "server-only"
import crypto from "crypto"
import { db } from "@/lib/db"
import { sendEmailVerificationEmail } from "@/lib/email"

const EXPIRES_IN_HOURS = 24

export async function sendVerificationEmail(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { email: true },
  })
  if (!user) throw new Error("User not found")

  const token   = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + EXPIRES_IN_HOURS * 60 * 60 * 1000)

  await db.user.update({
    where: { id: userId },
    data:  { emailVerificationToken: token, emailVerificationExpires: expires },
  })

  const verifyLink = `${process.env.NEXTAUTH_URL}/email-verification?token=${token}`
  await sendEmailVerificationEmail(user.email, verifyLink)
}

export async function verifyEmailToken(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await db.user.findUnique({
    where:  { emailVerificationToken: token },
    select: { id: true, emailVerified: true, emailVerificationExpires: true },
  })

  if (!user) {
    return { ok: false, error: "Invalid or expired verification link." }
  }
  if (user.emailVerified) {
    return { ok: true } // idempotent — already verified
  }
  if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
    return { ok: false, error: "This link has expired. Please request a new one." }
  }

  await db.user.update({
    where: { id: user.id },
    data:  { emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
  })

  return { ok: true }
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await db.user.findUnique({
    where:  { email },
    select: { id: true, emailVerified: true },
  })
  // Silently do nothing — don't leak whether the address exists or is already verified
  if (!user || user.emailVerified) return

  await sendVerificationEmail(user.id)
}
