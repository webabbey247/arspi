import { db } from "@/lib/db"
import type { Role } from "@prisma/client"
import type { OAuthProfile, OAuthProviderName } from "@/lib/oauth/providers"

export type OAuthUser = {
  id:           string
  email:        string
  role:         Role
  firstName:    string | null
  lastName:     string | null
  hasProfile:   boolean
  hasInterests: boolean
}

export type FindOrCreateOAuthUserResult =
  | { success: true; user: OAuthUser }
  | { success: false; reason: "email_not_verified" | "disabled" }

type UserWithProfile = {
  id: string; email: string; role: Role; status: string
  hasProfile: boolean; hasInterests: boolean
  profile: { firstName: string | null; lastName: string | null } | null
}

function toOAuthUser(user: UserWithProfile): OAuthUser {
  return {
    id:           user.id,
    email:        user.email,
    role:         user.role,
    firstName:    user.profile?.firstName ?? null,
    lastName:     user.profile?.lastName  ?? null,
    hasProfile:   user.hasProfile,
    hasInterests: user.hasInterests,
  }
}

/** Finds the user for an OAuth login, linking or creating as needed:
 *   1. An `Account` already links this exact (provider, providerAccountId) → return its user.
 *   2. No linked Account, but a User already exists with this (verified) email
 *      — from a password signup or a different provider — link this Account
 *      to it automatically; the provider already proved the email is theirs.
 *   3. Neither exists — create a new User (no password, pre-verified since the
 *      provider verified the email) and its Account in one transaction. */
export async function findOrCreateOAuthUser(
  provider: OAuthProviderName,
  profile:  OAuthProfile,
): Promise<FindOrCreateOAuthUserResult> {
  if (!profile.emailVerified) return { success: false, reason: "email_not_verified" }

  const existingAccount = await db.account.findUnique({
    where:   { provider_providerAccountId: { provider, providerAccountId: profile.providerAccountId } },
    include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } } },
  })
  if (existingAccount) {
    if (existingAccount.user.status !== "ACTIVE") return { success: false, reason: "disabled" }
    return { success: true, user: toOAuthUser(existingAccount.user) }
  }

  const existingUser = await db.user.findUnique({
    where:   { email: profile.email },
    include: { profile: { select: { firstName: true, lastName: true } } },
  })
  if (existingUser) {
    if (existingUser.status !== "ACTIVE") return { success: false, reason: "disabled" }
    await db.account.create({
      data: { userId: existingUser.id, type: "oauth", provider, providerAccountId: profile.providerAccountId },
    })
    return { success: true, user: toOAuthUser(existingUser) }
  }

  const user = await db.$transaction(async tx => {
    const created = await tx.user.create({
      data: {
        email:         profile.email,
        password:      null,
        role:          "USER",
        status:        "ACTIVE",
        emailVerified: true, // the provider already verified it
        hasProfile:    false,
        hasInterests:  false,
      },
    })
    await tx.account.create({
      data: { userId: created.id, type: "oauth", provider, providerAccountId: profile.providerAccountId },
    })
    return created
  })

  return {
    success: true,
    user: {
      id: user.id, email: user.email, role: user.role,
      firstName: profile.firstName, lastName: profile.lastName,
      hasProfile: false, hasInterests: false,
    },
  }
}
