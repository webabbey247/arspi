import "server-only"
import { db } from "@/lib/db"

export type NotificationInput = {
  type:  string
  title: string
  body?: string | null
  link?: string | null
  /** What it's about — shown as "Related to" (a programme, a person…). */
  context?: string | null
}

/** In-app alerts for specific users. */
export async function notifyUsers(userIds: string[], n: NotificationInput) {
  const ids = [...new Set(userIds)]
  if (ids.length === 0) return
  await db.notification.createMany({
    data: ids.map(userId => ({
      userId, type: n.type, title: n.title,
      body: n.body ?? null, link: n.link ?? null, context: n.context ?? null,
    })),
  })
}

/** Alerts every active admin. */
export async function notifyAdmins(n: NotificationInput) {
  const admins = await activeAdmins()
  await notifyUsers(admins.map(a => a.id), n)
}

/** Alerts a programme's assigned instructor — or the admins when nobody is
 *  assigned yet, so the alert always reaches someone who can act on it. */
export async function notifyProgrammeStaff(courseId: string, n: NotificationInput) {
  const course = await db.course.findUnique({ where: { id: courseId }, select: { instructorId: true } })
  if (course?.instructorId) await notifyUsers([course.instructorId], n)
  else await notifyAdmins(n)
}

/**
 * Fire-and-forget wrapper for the event hooks across the app. An alert is a
 * side effect: if creating it fails, the enquiry, submission or enrolment it
 * describes must still succeed — so errors are logged, never thrown.
 */
export function notifySafely(task: () => Promise<unknown>) {
  task().catch(e => console.error("[notification]", e))
}

/** Every active admin — the recipients of "something needs your approval". */
export async function activeAdmins() {
  return db.user.findMany({
    where:  { role: "ADMIN", status: "ACTIVE" },
    select: { id: true, email: true },
  })
}

export async function listNotifications(userId: string, limit = 30) {
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit }),
    db.notification.count({ where: { userId, readAt: null } }),
  ])
  return {
    unread,
    items: items.map(n => ({
      id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, context: n.context,
      read: !!n.readAt, createdAt: n.createdAt.toISOString(),
    })),
  }
}

/** Marks some (or, with no ids, all) of a user's notifications read. Scoped to
 *  the user, so one person can never touch another's alerts. */
export async function markNotificationsRead(userId: string, ids?: string[]) {
  await db.notification.updateMany({
    where: { userId, readAt: null, ...(ids && { id: { in: ids } }) },
    data:  { readAt: new Date() },
  })
}
