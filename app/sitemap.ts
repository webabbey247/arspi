import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"
import { getPrograms } from "@/services/program.service"
import { getInsights } from "@/services/insight.service"
import { getWorkshops } from "@/services/workshop.service"
import { getProjects } from "@/services/project.service"
import { getCareers } from "@/services/career.service"

/** Regenerated hourly — new programmes/articles get picked up without a
 *  redeploy, and the sitemap isn't rebuilt on every crawler hit. */
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

/** Static public routes. Success/utility/auth pages are deliberately absent —
 *  they're disallowed in robots.ts and carry no search value. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] = [
  { path: "/",                                 priority: 1.0, changeFrequency: "weekly"  },
  { path: "/programs",                         priority: 0.9, changeFrequency: "daily"   },
  { path: "/workshop",                         priority: 0.9, changeFrequency: "daily"   },
  { path: "/insights",                         priority: 0.8, changeFrequency: "daily"   },
  { path: "/our-research/research-training",   priority: 0.8, changeFrequency: "weekly"  },
  { path: "/our-research/research-projects",   priority: 0.8, changeFrequency: "weekly"  },
  { path: "/solutions",                        priority: 0.7, changeFrequency: "monthly" },
  { path: "/solutions/mentortrack",            priority: 0.6, changeFrequency: "monthly" },
  { path: "/solutions/resolverite",            priority: 0.6, changeFrequency: "monthly" },
  { path: "/about",                            priority: 0.6, changeFrequency: "monthly" },
  { path: "/team",                             priority: 0.6, changeFrequency: "monthly" },
  { path: "/careers",                          priority: 0.6, changeFrequency: "weekly"  },
  { path: "/contact",                          priority: 0.5, changeFrequency: "yearly"  },
  { path: "/support",                          priority: 0.5, changeFrequency: "yearly"  },
  { path: "/workshop/archive",                 priority: 0.4, changeFrequency: "weekly"  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => ({
    url:             `${SITE_URL}${r.path}`,
    lastModified:    now,
    changeFrequency: r.changeFrequency,
    priority:        r.priority,
  }))

  // One bad query shouldn't blank the whole sitemap — fall back to an empty
  // list for that content type and still serve everything else.
  const [programs, insights, workshops, projects, careers] = await Promise.all([
    getPrograms({ status: "PUBLISHED" }).catch(() => []),
    getInsights({ published: true }).catch(() => []),
    getWorkshops({ published: true }).catch(() => []),
    getProjects().catch(() => []),
    getCareers({ status: "PUBLISHED" }).catch(() => []),
  ])

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...programs.map(p => ({
      url:             `${SITE_URL}/programs/${p.slug}`,
      lastModified:    p.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority:        0.8,
    })),
    ...insights.map(i => ({
      url:             `${SITE_URL}/insights/${i.slug}`,
      lastModified:    i.updatedAt ?? now,
      changeFrequency: "monthly" as const,
      priority:        0.7,
    })),
    ...workshops.map(w => ({
      url:             `${SITE_URL}/workshop/${w.slug}`,
      lastModified:    w.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority:        0.7,
    })),
    ...projects.map(p => ({
      url:             `${SITE_URL}/our-research/research-projects/${p.slug}`,
      lastModified:    p.updatedAt ?? now,
      changeFrequency: "monthly" as const,
      priority:        0.6,
    })),
    ...careers.map(c => ({
      url:             `${SITE_URL}/careers/${c.slug}`,
      lastModified:    c.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority:        0.5,
    })),
  ]

  return [...staticEntries, ...dynamicEntries]
}
