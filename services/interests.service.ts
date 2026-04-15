import { db } from "@/lib/db"
import type { LearningInterestsInput } from "@/lib/validators/onboarding"

export async function saveInterests(input: LearningInterestsInput): Promise<void> {
  const { userId, interests, referralSource, emailOptIn } = input

  await db.profile.upsert({
    where:  { userId },
    create: { userId, interests, referralSource, emailOptIn },
    update: { interests, referralSource, emailOptIn },
  })

  await db.user.update({
    where: { id: userId },
    data:  { hasInterests: true },
  })
}
