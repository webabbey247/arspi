import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { Role, UserStatus } from "@prisma/client"

export type { Role, UserStatus }

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRow = {
  id:            string
  email:         string
  role:          Role
  status:        UserStatus
  emailVerified: boolean
  hasProfile:    boolean
  createdAt:     Date
  profile: {
    firstName:    string | null
    lastName:     string | null
    avatar:       string | null
    organisation: string | null
    jobTitle:     string | null
  } | null
  _count: { enrollments: number }
}

/** A row for the Students / Staff directories. */
export type DirectoryRow = Omit<UserRow, "_count"> & {
  invitedAt: Date | null
  /** Invited as staff but hasn't set a password yet. */
  invitePending: boolean
  _count: { enrollments: number; taughtCourses: number }
}

export type UserDetail = {
  id:            string
  email:         string
  role:          Role
  status:        UserStatus
  emailVerified: boolean
  hasProfile:    boolean
  hasInterests:  boolean
  createdAt:     Date
  profile: {
    firstName:     string | null
    lastName:      string | null
    avatar:        string | null
    bio:           string | null
    phone:         string | null
    country:       string | null
    jobTitle:      string | null
    organisation:  string | null
    roleType:      string | null
    interests:     string[]
    referralSource:string | null
    emailOptIn:    boolean
  } | null
  _count: {
    enrollments:       number
    lessonCompletions: number
    certificates:      number
  }
}

export type UserServiceResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string }

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getUsers(filters?: {
  role?:   Role
  /** Any of these roles — e.g. ADMIN + INSTRUCTOR for the staff directory. */
  roles?:  Role[]
  status?: UserStatus
  search?: string
}): Promise<DirectoryRow[]> {
  const rows = await db.user.findMany({
    where: {
      ...(filters?.role   !== undefined && { role:   filters.role }),
      ...(filters?.roles  !== undefined && { role:   { in: filters.roles } }),
      ...(filters?.status !== undefined && { status: filters.status }),
      ...(filters?.search && {
        OR: [
          { email:   { contains: filters.search, mode: "insensitive" } },
          { profile: { firstName: { contains: filters.search, mode: "insensitive" } } },
          { profile: { lastName:  { contains: filters.search, mode: "insensitive" } } },
        ],
      }),
    },
    select: {
      id:            true,
      email:         true,
      role:          true,
      status:        true,
      emailVerified: true,
      hasProfile:    true,
      createdAt:     true,
      profile: {
        select: {
          firstName:    true,
          lastName:     true,
          avatar:       true,
          organisation: true,
          jobTitle:     true,
        },
      },
      invitedAt: true,
      // Only to derive invitePending below — never returned.
      password:  true,
      _count: { select: { enrollments: true, taughtCourses: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(({ password, ...u }) => ({ ...u, invitePending: !!u.invitedAt && !password }))
}

export async function getUserById(id: string): Promise<UserRow | null> {
  return db.user.findUnique({
    where: { id },
    select: {
      id:            true,
      email:         true,
      role:          true,
      status:        true,
      emailVerified: true,
      hasProfile:    true,
      createdAt:     true,
      profile: {
        select: {
          firstName:    true,
          lastName:     true,
          avatar:       true,
          organisation: true,
          jobTitle:     true,
        },
      },
      _count: { select: { enrollments: true } },
    },
  })
}

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  return db.user.findUnique({
    where: { id },
    select: {
      id:            true,
      email:         true,
      role:          true,
      status:        true,
      emailVerified: true,
      hasProfile:    true,
      hasInterests:  true,
      createdAt:     true,
      profile: {
        select: {
          firstName:     true,
          lastName:      true,
          avatar:        true,
          bio:           true,
          phone:         true,
          country:       true,
          jobTitle:      true,
          organisation:  true,
          roleType:      true,
          interests:     true,
          referralSource:true,
          emailOptIn:    true,
        },
      },
      _count: {
        select: {
          enrollments:       true,
          lessonCompletions: true,
          certificates:      true,
        },
      },
    },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function updateUser(
  id: string,
  input: { role?: Role; status?: UserStatus }
): Promise<UserServiceResult<UserRow>> {
  const existing = await db.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return { success: false, error: "User not found." }

  const user = await db.user.update({
    where: { id },
    data: {
      ...(input.role   !== undefined && { role:   input.role }),
      ...(input.status !== undefined && { status: input.status }),
    },
    select: {
      id:            true,
      email:         true,
      role:          true,
      status:        true,
      emailVerified: true,
      hasProfile:    true,
      createdAt:     true,
      profile: {
        select: {
          firstName:    true,
          lastName:     true,
          avatar:       true,
          organisation: true,
          jobTitle:     true,
        },
      },
      _count: { select: { enrollments: true } },
    },
  })

  return { success: true, data: user }
}

export async function adminSetPassword(
  id: string,
  newPassword: string
): Promise<UserServiceResult<null>> {
  const existing = await db.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return { success: false, error: "User not found." }

  const hashed = await bcrypt.hash(newPassword, 12)
  await db.user.update({ where: { id }, data: { password: hashed } })

  return { success: true, data: null }
}
