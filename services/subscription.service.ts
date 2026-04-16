import { db } from "@/lib/db"
import { SubscriptionStatus } from "@prisma/client"

export type { SubscriptionStatus }

export type NewsletterSubscriberRow = {
  id: string
  email: string
  status: SubscriptionStatus
  subscribedAt: Date
  unsubscribedAt: Date | null
}

export type SubscribeResult =
  | { success: true; alreadySubscribed: false }
  | { success: true; alreadySubscribed: true }
  | { success: false; error: string }

export async function subscribeEmail(email: string): Promise<SubscribeResult> {
  const existing = await db.newsletterSubscriber.findUnique({
    where: { email },
    select: { id: true, status: true },
  })

  if (existing) {
    if (existing.status === "ACTIVE") {
      return { success: true, alreadySubscribed: true }
    }

    // Re-activate if previously unsubscribed
    await db.newsletterSubscriber.update({
      where: { email },
      data: { status: "ACTIVE", unsubscribedAt: null, subscribedAt: new Date() },
    })

    return { success: true, alreadySubscribed: false }
  }

  await db.newsletterSubscriber.create({
    data: { email },
  })

  return { success: true, alreadySubscribed: false }
}

export async function getNewsletterSubscribers(filters?: {
  status?: SubscriptionStatus
  search?: string
}): Promise<NewsletterSubscriberRow[]> {
  return db.newsletterSubscriber.findMany({
    where: {
      ...(filters?.status !== undefined && { status: filters.status }),
      ...(filters?.search && {
        email: { contains: filters.search, mode: "insensitive" },
      }),
    },
    orderBy: { subscribedAt: "desc" },
  })
}
