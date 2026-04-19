export type PublicProgram = {
  id:          string
  title:       string
  slug:        string
  description: string
  thumbnail:   string | null
  price:       number
  level:       string
  featured:    boolean
  category:    { id: string; name: string; slug: string } | null
  instructor:  { name: string }
  enrolled:    number
  createdAt:   string
  tagline:     string | null
  duration:    string | null
  format:      string | null
  startDate:   string | null
  rating:      number | null
  reviewCount: number | null
}

type GetProgramsOptions = {
  featured?: boolean
  categoryId?: string
  level?: string
  limit?: number
}

export async function getPrograms(options?: GetProgramsOptions): Promise<PublicProgram[]> {
  const searchParams = new URLSearchParams()
  if (options?.featured !== undefined) searchParams.set("featured", String(options.featured))
  if (options?.categoryId)             searchParams.set("categoryId", options.categoryId)
  if (options?.level)                  searchParams.set("level", options.level)
  const query = searchParams.toString()

  const response = await fetch(`/api/programs/public${query ? `?${query}` : ""}`)

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.error ?? "Failed to load programs")
  }

  const payload = await response.json()
  const all: PublicProgram[] = payload?.programs ?? []
  return options?.limit ? all.slice(0, options.limit) : all
}
