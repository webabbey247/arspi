import { db } from "@/lib/db"

/**
 * Device sessions.
 *
 * The auth tokens are stateless JWTs, so until this table existed there was
 * no way to answer "where am I signed in?" or to sign a device out remotely.
 * Each row is one sign-in; the refresh token carries the row id as its `sid`
 * claim. Revoking a row makes the next refresh fail, so the device is out
 * within the access token's 15-minute life at worst — not instantly. Say that
 * in the UI rather than implying an immediate kill.
 */

/** False until the migration has been applied *and* `prisma generate` has
 *  re-run — the delegate simply does not exist on a client generated before
 *  the model did. Checked rather than assumed so a missing table surfaces as
 *  an explainable UI state instead of a 500. */
export function sessionsAvailable(): boolean {
  return typeof (db as { userSession?: unknown }).userSession !== "undefined"
}

export type DeviceSession = {
  id:         string
  browser:    string
  os:         string
  /** True for the session making the request. */
  current:    boolean
  ipAddress:  string | null
  createdAt:  string
  lastSeenAt: string
}

/** Enough user-agent parsing to label a row, and no more. A UA string is
 *  self-reported and trivially spoofed, so it is only ever shown back to the
 *  person who created it — never used for any decision. */
export function describeUserAgent(ua: string | null | undefined): { browser: string; os: string } {
  if (!ua) return { browser: "Unknown browser", os: "Unknown device" }

  // Order matters: Edge and Opera both claim to be Chrome, and Chrome claims
  // to be Safari, so the most specific brand has to win first.
  const browser =
    /\bEdg\//.test(ua)                          ? "Edge"
    : /\bOPR\/|\bOpera\b/.test(ua)              ? "Opera"
    : /\bBrave\//.test(ua)                      ? "Brave"
    : /\bFirefox\//.test(ua)                    ? "Firefox"
    : /\bChrome\//.test(ua)                     ? "Chrome"
    : /\bSafari\//.test(ua)                     ? "Safari"
    : "Unknown browser"

  const os =
    /\bWindows NT 10/.test(ua)                  ? "Windows"
    : /\bWindows\b/.test(ua)                    ? "Windows"
    : /\biPhone\b/.test(ua)                     ? "iPhone"
    : /\biPad\b/.test(ua)                       ? "iPad"
    : /\bAndroid\b/.test(ua)                    ? "Android"
    : /\bMac OS X\b|\bMacintosh\b/.test(ua)     ? "macOS"
    : /\bLinux\b/.test(ua)                      ? "Linux"
    : "Unknown device"

  return { browser, os }
}

/** Opens a session row for a fresh sign-in and returns its id, which becomes
 *  the refresh token's `sid`. */
/** Returns null when session tracking is unavailable, so a sign-in still
 *  succeeds — a convenience feature must never block authentication. */
export async function openSession(input: {
  userId:    string
  userAgent: string | null
  ipAddress: string | null
  expiresAt: Date
}): Promise<string | null> {
  if (!sessionsAvailable()) return null
  const row = await db.userSession.create({
    data: {
      userId:    input.userId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt: input.expiresAt,
    },
    select: { id: true },
  })
  return row.id
}

/** True when the session is still usable. Called on every refresh, so it is a
 *  single indexed read. */
export async function isSessionLive(sessionId: string, userId: string): Promise<boolean> {
  // Deliberately fails open. This runs inside the refresh path, whose caller
  // treats any throw as "not signed in" — so a schema problem here would log
  // out every user at once. The refresh has already done a successful DB read
  // (loadSessionPayload) by this point, so a failure here is not a database
  // outage; it means the table is missing, and mass logout is far worse than
  // a revoked session surviving until its token expires.
  if (!sessionsAvailable()) return true
  try {
    const row = await db.userSession.findUnique({
      where:  { id: sessionId },
      select: { userId: true, revokedAt: true, expiresAt: true },
    })
    return !!row && row.userId === userId && row.revokedAt === null && row.expiresAt > new Date()
  } catch (err) {
    console.error("[isSessionLive] could not check the session; allowing", err)
    return true
  }
}

/** Records activity and extends the row to match the rotated refresh token. */
export async function touchSession(sessionId: string, expiresAt: Date): Promise<void> {
  if (!sessionsAvailable()) return
  try {
    await db.userSession.update({
      where: { id: sessionId },
      data:  { lastSeenAt: new Date(), expiresAt },
    })
  } catch {
    // A deleted row simply means the session is gone; the caller's liveness
    // check is what gates access, so there is nothing to recover here.
  }
}

/** Rows hold an IP address and a user-agent, which are personal data kept for
 *  a security purpose — so they should not outlive that purpose. Anything dead
 *  for 30 days is deleted. Called opportunistically from the list endpoint
 *  rather than on a schedule: no cron exists here, and the cost is one indexed
 *  delete on a screen almost nobody opens. */
export async function pruneDeadSessions(userId: string): Promise<void> {
  if (!sessionsAvailable()) return
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  try {
    await db.userSession.deleteMany({
      where: {
        userId,
        OR: [{ expiresAt: { lt: cutoff } }, { revokedAt: { lt: cutoff } }],
      },
    })
  } catch {
    // Housekeeping only — never fail the request it is attached to.
  }
}

export async function listSessions(userId: string, currentSessionId: string | null): Promise<DeviceSession[]> {
  if (!sessionsAvailable()) return []
  const rows = await db.userSession.findMany({
    where:   { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true, userAgent: true, ipAddress: true, createdAt: true, lastSeenAt: true,
    },
  })

  return rows.map(r => {
    const { browser, os } = describeUserAgent(r.userAgent)
    return {
      id:         r.id,
      browser,
      os,
      current:    r.id === currentSessionId,
      ipAddress:  r.ipAddress,
      createdAt:  r.createdAt.toISOString(),
      lastSeenAt: r.lastSeenAt.toISOString(),
    }
  })
}

/** Revokes one session. Scoped by userId so an id alone cannot end someone
 *  else's session. Returns false when nothing matched. */
export async function revokeSession(userId: string, sessionId: string): Promise<boolean> {
  if (!sessionsAvailable()) return false
  const res = await db.userSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data:  { revokedAt: new Date() },
  })
  return res.count > 0
}

/** Revokes everything except the caller's own session. */
export async function revokeOtherSessions(userId: string, keepSessionId: string | null): Promise<number> {
  if (!sessionsAvailable()) return 0
  const res = await db.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(keepSessionId ? { id: { not: keepSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  })
  return res.count
}
