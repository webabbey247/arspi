export type PublicWorkshop = {
  id: string
  title: string
  slug: string
  type: string
  description: string
  date: string
  time: string
  duration: string
  facilitator: string
  category: string
  fee: string | number
  capacity: number
  registered: number
  featured: boolean
  coverImage: string | null
  publishedAt?: string | null
}

type GetWorkshopsOptions = {
  limit?: number
  sort?: "upcoming" | "popular"
}

function toQueryString(params: Record<string, string | number>) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value))
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

export async function getWorkshops(options?: GetWorkshopsOptions): Promise<PublicWorkshop[]> {
  const params: Record<string, string | number> = {}
  if (options?.limit) params.limit = options.limit
  if (options?.sort) params.sort = options.sort

  const query = toQueryString(params)
  const response = await fetch(`/api/workshops/public${query}`)

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.error ?? "Failed to load workshops")
  }

  const payload = await response.json()
  return payload?.workshops ?? []
}
