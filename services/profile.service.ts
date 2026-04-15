import { db } from "@/lib/db"
import type { ProfileInfoInput } from "@/lib/validators/onboarding"

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
