export type PublicWorkshop = {
  id:             string
  title:          string
  slug:           string
  type:           string
  description:    string
  date:           string | null
  startTime:      string
  endTime:        string
  timezone:       string
  duration:       number
  level:          string
  facilitator:    string
  category:       string
  fee:            string | number
  medium:         string
  onlinePlatform: string | null
  onlineLink:     string | null
  venueAddress:   string | null
  venueCity:      string | null
  venueState:     string | null
  venueCountry:   string | null
  capacity:       number
  registered:     number
  featured:       boolean
  coverImage:     string | null
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
