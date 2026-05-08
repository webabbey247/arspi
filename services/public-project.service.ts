type TaxonomyRef = { id: string; name: string; slug: string }

export type PublicProjectPerson = {
  imageUrl: string | null
  name:     string
  role:     string | null
}

export type PublicProject = {
  id:            string
  title:         string
  slug:          string
  excerpt:       string
  description:   string
  coverImage:    string | null
  status:        "COMPLETE" | "ACTIVE"
  client:        string
  clientLogo:    string | null
  startDate:     string | null
  endDate:       string | null
  division:      TaxonomyRef | null
  department:    TaxonomyRef | null
  services:      TaxonomyRef[]
  investigators: PublicProjectPerson[]
  members:       PublicProjectPerson[]
  createdAt:     string
}

export type PublicTaxonomyItem = {
  id:    string
  name:  string
  slug:  string
  count: number
}

type GetProjectsOptions = {
  status?:       "COMPLETE" | "ACTIVE"
  divisionId?:   string
  departmentId?: string
  serviceId?:    string
  limit?:        number
}

export type PublicProjectsPayload = {
  projects:    PublicProject[]
  divisions:   PublicTaxonomyItem[]
  departments: PublicTaxonomyItem[]
  services:    PublicTaxonomyItem[]
}

export async function getProjects(
  options?: GetProjectsOptions
): Promise<PublicProjectsPayload> {
  const searchParams = new URLSearchParams()
  if (options?.status)       searchParams.set("status",       options.status)
  if (options?.divisionId)   searchParams.set("divisionId",   options.divisionId)
  if (options?.departmentId) searchParams.set("departmentId", options.departmentId)
  if (options?.serviceId)    searchParams.set("serviceId",    options.serviceId)
  const query = searchParams.toString()

  const response = await fetch(`/api/projects/public${query ? `?${query}` : ""}`)
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.error ?? "Failed to load projects")
  }

  const payload = await response.json()
  const projects: PublicProject[]            = payload?.projects    ?? []
  const divisions:   PublicTaxonomyItem[]    = payload?.divisions   ?? []
  const departments: PublicTaxonomyItem[]    = payload?.departments ?? []
  const services:    PublicTaxonomyItem[]    = payload?.services    ?? []
  return {
    projects:    options?.limit ? projects.slice(0, options.limit) : projects,
    divisions,
    departments,
    services,
  }
}
