import { db } from "@/lib/db"

export type AuthorRow = {
  id: string
  name: string
  jobTitle: string | null
  bio: string | null
  avatar: string | null
  createdAt: Date
  updatedAt: Date
  _count?: { insights: number }
}

export type AuthorInput = {
  name: string
  jobTitle?: string | null
  bio?: string | null
  avatar?: string | null
}

export type AuthorServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getAuthors(): Promise<AuthorRow[]> {
  return db.author.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { insights: true } } },
  })
}

export async function getAuthorById(id: string): Promise<AuthorRow | null> {
  return db.author.findUnique({
    where: { id },
    include: { _count: { select: { insights: true } } },
  })
}

export async function createAuthor(
  input: AuthorInput
): Promise<AuthorServiceResult<AuthorRow>> {
  const existing = await db.author.findFirst({
    where: { name: { equals: input.name, mode: "insensitive" } },
  })
  if (existing) {
    return { success: false, error: "An author with this name already exists." }
  }

  const author = await db.author.create({
    data: {
      name:     input.name,
      jobTitle: input.jobTitle ?? null,
      bio:      input.bio      ?? null,
      avatar:   input.avatar   ?? null,
    },
    include: { _count: { select: { insights: true } } },
  })

  return { success: true, data: author }
}

export async function updateAuthor(
  id: string,
  input: Partial<AuthorInput>
): Promise<AuthorServiceResult<AuthorRow>> {
  const existing = await db.author.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Author not found." }
  }

  if (input.name && input.name !== existing.name) {
    const conflict = await db.author.findFirst({
      where: { name: { equals: input.name, mode: "insensitive" }, NOT: { id } },
    })
    if (conflict) {
      return { success: false, error: "An author with this name already exists." }
    }
  }

  const author = await db.author.update({
    where: { id },
    data: {
      ...(input.name     !== undefined && { name:     input.name }),
      ...(input.jobTitle !== undefined && { jobTitle: input.jobTitle }),
      ...(input.bio      !== undefined && { bio:      input.bio }),
      ...(input.avatar   !== undefined && { avatar:   input.avatar }),
    },
    include: { _count: { select: { insights: true } } },
  })

  return { success: true, data: author }
}

export async function deleteAuthor(id: string): Promise<AuthorServiceResult<null>> {
  const existing = await db.author.findUnique({
    where: { id },
    include: { _count: { select: { insights: true } } },
  })
  if (!existing) {
    return { success: false, error: "Author not found." }
  }
  if (existing._count.insights > 0) {
    return {
      success: false,
      error: `Cannot delete — ${existing._count.insights} insight(s) are assigned to this author.`,
    }
  }

  await db.author.delete({ where: { id } })
  return { success: true, data: null }
}
