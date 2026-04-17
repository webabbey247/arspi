export type PublicInsight = {
  id: string
  title: string
  slug: string
  excerpt: string
  featured: boolean
  readTime: string
  author: string
  authorInitials: string
  category: string
  date: string
  publishedAt: string | null
  coverImage: string | null
}

export type PublicInsightDetail = PublicInsight & {
  body: string
  authorJobTitle: string | null
  authorBio: string | null
}

export type PublicInsightCard = {
  slug: string
  title: string
  category: string
  date: string
  readTime: string
  author: string
}

export type PublicInsightDetailResponse = {
  insight: PublicInsightDetail
  prev: PublicInsightCard | null
  next: PublicInsightCard | null
  related: PublicInsightCard[]
}

type GetInsightsOptions = {
  category?: string
  featured?: boolean
}

function toQueryString(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params)
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

export async function getInsights(options?: GetInsightsOptions): Promise<PublicInsight[]> {
  const query = toQueryString({
    ...(options?.category ? { category: options.category } : {}),
    ...(options?.featured !== undefined ? { featured: String(options.featured) } : {}),
  })

  const response = await fetch(`/api/insights/public${query}`)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to load insights")
  }

  return payload?.insights ?? []
}

export async function getInsightBySlug(slug: string): Promise<PublicInsightDetailResponse> {
  const response = await fetch(`/api/insights/public/${slug}`)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(payload?.error ?? "Failed to load insight") as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return payload
}