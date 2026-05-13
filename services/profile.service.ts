import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import type { ProfileInfoInput } from "@/lib/validators/onboarding"

export type AccountProfile = {
  email:        string
  firstName:    string | null
  lastName:     string | null
  avatar:       string | null
  bio:          string | null
  phone:        string | null
  country:      string | null
  jobTitle:     string | null
  organisation: string | null
  addressLine1: string | null
  addressLine2: string | null
  city:         string | null
  state:        string | null
  postalCode:   string | null
  dateOfBirth:  string | null
  language:     string | null
  timezone:     string | null
  emailOptIn:   boolean
}

export type AccountUpdateInput = {
  firstName?:    string | null
  lastName?:     string | null
  avatar?:       string | null
  bio?:          string | null
  phone?:        string | null
  country?:      string | null
  jobTitle?:     string | null
  organisation?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?:         string | null
  state?:        string | null
  postalCode?:   string | null
  dateOfBirth?:  Date | null
  language?:     string | null
  timezone?:     string | null
  emailOptIn?:   boolean
}

export type AccountServiceResult<T = null> =
  | { success: true;  data: T }
  | { success: false; error: string }

export async function updateProfile(input: ProfileInfoInput): Promise<void> {
  const { userId, firstName, lastName, country, jobTitle, organisation, roleType } = input

  await db.profile.upsert({
    where:  { userId },
    create: { userId, firstName, lastName, country, jobTitle, organisation, roleType },
    update: { firstName, lastName, country, jobTitle, organisation, roleType },
  })

  await db.user.update({
    where: { id: userId },
    data:  { hasProfile: true },
  })
}

export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: {
      email:   true,
      profile: {
        select: {
          firstName:    true,
          lastName:     true,
          avatar:       true,
          bio:          true,
          phone:        true,
          country:      true,
          jobTitle:     true,
          organisation: true,
          addressLine1: true,
          addressLine2: true,
          city:         true,
          state:        true,
          postalCode:   true,
          dateOfBirth:  true,
          language:     true,
          timezone:     true,
          emailOptIn:   true,
        },
      },
    },
  })

  if (!user) return null

  return {
    email:        user.email,
    firstName:    user.profile?.firstName    ?? null,
    lastName:     user.profile?.lastName     ?? null,
    avatar:       user.profile?.avatar       ?? null,
    bio:          user.profile?.bio          ?? null,
    phone:        user.profile?.phone        ?? null,
    country:      user.profile?.country      ?? null,
    jobTitle:     user.profile?.jobTitle     ?? null,
    organisation: user.profile?.organisation ?? null,
    addressLine1: user.profile?.addressLine1 ?? null,
    addressLine2: user.profile?.addressLine2 ?? null,
    city:         user.profile?.city         ?? null,
    state:        user.profile?.state        ?? null,
    postalCode:   user.profile?.postalCode   ?? null,
    dateOfBirth:  user.profile?.dateOfBirth?.toISOString() ?? null,
    language:     user.profile?.language     ?? null,
    timezone:     user.profile?.timezone     ?? null,
    emailOptIn:   user.profile?.emailOptIn   ?? true,
  }
}

export async function updateAccountProfile(
  userId: string,
  input:  AccountUpdateInput,
): Promise<AccountServiceResult<AccountProfile>> {
  const existing = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!existing) return { success: false, error: "User not found." }

  await db.profile.upsert({
    where:  { userId },
    create: { userId, ...input },
    update: input,
  })

  await db.user.update({ where: { id: userId }, data: { hasProfile: true } })

  const profile = await getAccountProfile(userId)
  if (!profile) return { success: false, error: "Profile not found after update." }

  return { success: true, data: profile }
}

export async function changeOwnPassword(
  userId:          string,
  currentPassword: string,
  newPassword:     string,
): Promise<AccountServiceResult> {
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { id: true, password: true },
  })
  if (!user)          return { success: false, error: "User not found." }
  if (!user.password) return { success: false, error: "This account has no password set." }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) return { success: false, error: "Current password is incorrect." }

  const hashed = await bcrypt.hash(newPassword, 12)
  await db.user.update({ where: { id: userId }, data: { password: hashed } })

  return { success: true, data: null }
}

export async function disableOwnAccount(userId: string): Promise<AccountServiceResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return { success: false, error: "User not found." }

  await db.user.update({ where: { id: userId }, data: { status: "DISABLED" } })
  return { success: true, data: null }
}
