import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import type { Role } from "@prisma/client"
import type { BasicInfoInput } from "@/lib/validators/onboarding"

export type CreateUserResult =
  | { success: true; userId: string }
  | { success: false; conflict: true }

export async function createUser(input: BasicInfoInput): Promise<CreateUserResult> {
  const { email, password } = input

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existing) return { success: false, conflict: true }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: { email, password: hashedPassword, role: "USER" },
    select: { id: true },
  })

  return { success: true, userId: user.id }
}

// ── Login ──────────────────────────────────────────────────────────────────

export type LoginUserResult =
  | { success: true; user: { id: string; email: string; role: Role; firstName: string | null; lastName: string | null; hasProfile: boolean; hasInterests: boolean; emailVerified: boolean } }
  | { success: false; reason: "not_found" | "invalid_password" | "disabled" }

export async function loginUser(email: string, password: string): Promise<LoginUserResult> {
  const user = await db.user.findUnique({
    where: { email },
    include: { profile: { select: { firstName: true, lastName: true } } },
  })

  if (!user)          return { success: false, reason: "not_found" }
  if (!user.password) return { success: false, reason: "invalid_password" } // OAuth-only account

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { success: false, reason: "invalid_password" }

  // Checked only after the password is proven correct — an unauthenticated
  // prober who doesn't know the password should never learn an account is
  // disabled just from its email.
  if (user.status !== "ACTIVE") return { success: false, reason: "disabled" }

  return {
    success: true,
    user: {
      id:           user.id,
      email:        user.email,
      role:         user.role,
      firstName:    user.profile?.firstName ?? null,
      lastName:     user.profile?.lastName  ?? null,
      hasProfile:    user.hasProfile,
      hasInterests:  user.hasInterests,
      emailVerified: user.emailVerified,
    },
  }
}
