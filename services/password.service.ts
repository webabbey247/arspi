import crypto from "crypto"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const BASE_URL     = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

// ── Request reset ──────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.user.findUnique({
    where:  { email },
    select: { id: true, password: true },
  })

  // Always return without error — never reveal whether the email exists
  if (!user || !user.password) return

  // Invalidate any existing unused tokens for this user
  await db.passwordResetToken.updateMany({
    where:  { userId: user.id, used: false },
    data:   { used: true },
  })

  const token = crypto.randomBytes(32).toString("hex")

  await db.passwordResetToken.create({
    data: {
      userId:    user.id,
      token,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })

  const resetLink = `${BASE_URL}/reset-password?token=${token}`
  await sendPasswordResetEmail(email, resetLink)
}

// ── Reset password ─────────────────────────────────────────────────────────

export type ResetPasswordResult =
  | { success: true }
  | { success: false; reason: "invalid_token" | "expired_token" }

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
  const record = await db.passwordResetToken.findUnique({
    where: { token },
  })

  if (!record || record.used) {
    return { success: false, reason: "invalid_token" }
  }

  if (record.expiresAt < new Date()) {
    return { success: false, reason: "expired_token" }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data:  { password: hashedPassword },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data:  { used: true },
    }),
  ])

  return { success: true }
}
