import "server-only"
import crypto from "crypto"
import { db } from "@/lib/db"
import { sendNoticeEmail } from "@/lib/email"
import { absoluteAppUrl } from "@/lib/app-url"

/** Invites last a week — long enough for someone to get round to it. */
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

const hashToken = (raw: string) => crypto.createHash("sha256").update(raw).digest("hex")

export type InviteInput = { email: string; firstName?: string; lastName?: string }

export type InviteResult =
  | { ok: true; outcome: "invited" | "resent"; userId: string; emailSent: boolean }
  | { ok: false; error: string }

/**
 * Issues a set-your-password link. Reuses the password-reset token table: the
 * token is single-use, stored only as a hash, and accepting it also confirms
 * the email address (only its owner could have received the link).
 */
async function sendInvite(userId: string, email: string, firstName?: string | null) {
  await db.passwordResetToken.updateMany({ where: { userId, used: false }, data: { used: true } })
  const raw = crypto.randomBytes(32).toString("hex")
  await db.passwordResetToken.create({
    data: { userId, token: hashToken(raw), expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  })
  try {
    await sendNoticeEmail({
      to: email,
      subject: "You've been invited to teach at ARPS Institute",
      heading: `Welcome${firstName ? `, ${firstName}` : ""}`,
      paragraphs: [
        "You've been invited to join ARPS Institute as an instructor.",
        "Set a password to activate your account. You'll then be able to review, edit and grade the programmes assigned to you.",
      ],
      cta: { label: "Set your password", url: absoluteAppUrl(`/reset-password?token=${raw}&invite=1`) },
      footnote: "This invitation expires in 7 days. If you weren't expecting it, you can ignore this email.",
    })
    return true
  } catch (e) {
    console.error("[staff invite email]", e)
    return false
  }
}

/**
 * Invites one instructor. New email → creates an instructor account with no
 * password and sends the invite. An instructor who never accepted → sends a
 * fresh invite. Anyone else with that email already has an account, and their
 * role isn't changed here.
 */
export async function inviteInstructor(input: InviteInput): Promise<InviteResult> {
  const email = input.email.trim().toLowerCase()
  const firstName = input.firstName?.trim() || null
  const lastName  = input.lastName?.trim() || null

  const existing = await db.user.findUnique({
    where:  { email },
    select: { id: true, role: true, password: true, profile: { select: { firstName: true } } },
  })

  if (existing) {
    if (existing.role === "INSTRUCTOR" && !existing.password) {
      await db.user.update({ where: { id: existing.id }, data: { invitedAt: new Date() } })
      const emailSent = await sendInvite(existing.id, email, existing.profile?.firstName ?? firstName)
      return { ok: true, outcome: "resent", userId: existing.id, emailSent }
    }
    const what = existing.role === "USER" ? "a student" : existing.role === "ADMIN" ? "an admin" : "an instructor"
    return { ok: false, error: `${email} already has an account as ${what}.` }
  }

  const user = await db.user.create({
    data: {
      email,
      role: "INSTRUCTOR",
      invitedAt: new Date(),
      // Staff skip the learner onboarding (profile + interests steps).
      hasProfile: true,
      hasInterests: true,
      profile: { create: { firstName, lastName } },
    },
    select: { id: true },
  })
  const emailSent = await sendInvite(user.id, email, firstName)
  return { ok: true, outcome: "invited", userId: user.id, emailSent }
}

/** Sends a fresh invite to an instructor who hasn't set a password yet. */
export async function resendInvite(userId: string): Promise<InviteResult> {
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { id: true, email: true, role: true, password: true, profile: { select: { firstName: true } } },
  })
  if (!user) return { ok: false, error: "User not found." }
  if (user.role === "USER") return { ok: false, error: "Only staff can be invited." }
  if (user.password) return { ok: false, error: "This person has already accepted their invite." }
  await db.user.update({ where: { id: userId }, data: { invitedAt: new Date() } })
  const emailSent = await sendInvite(user.id, user.email, user.profile?.firstName)
  return { ok: true, outcome: "resent", userId, emailSent }
}
