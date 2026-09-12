import type { Metadata } from "next"
import { notFound } from "next/navigation"
import JsonLd from "@/components/seo/JsonLd"
import { SITE_URL, SITE_NAME, absoluteUrl, metaDescription } from "@/lib/seo"
import { getInsightBySlug } from "@/services/insight.service"
import InsightDetailClient from "./InsightDetailClient"

/** Server shell for the article page.
 *
 *  The article UI itself is still the client component below (it fetches its
 *  own data through the public API, unchanged) — this wrapper exists so each
 *  article gets its own title/description/OG image and Article structured
 *  data. Before this, every article inherited the homepage's metadata
 *  verbatim, which reads to search engines as dozens of duplicate pages. */

export const revalidate = 3600

async function loadInsight(slug: string) {
  const insight = await getInsightBySlug(slug)
  // Unpublished drafts must 404 rather than leak a title/excerpt into metadata.
  if (!insight || !insight.published) return null
  return insight
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const insight  = await loadInsight(slug)
  if (!insight) return {}

  const title       = insight.title
  const description = metaDescription(insight.excerpt) ?? metaDescription(insight.body)
  const url         = `${SITE_URL}/insights/${insight.slug}`
  const images      = insight.coverImage ? [{ url: absoluteUrl(insight.coverImage) }] : undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type:          "article",
      url,
      title,
      description,
      siteName:      SITE_NAME,
      images,
      publishedTime: (insight.publishedAt ?? insight.createdAt).toISOString(),
      modifiedTime:  insight.updatedAt.toISOString(),
      authors:       insight.author?.name ? [insight.author.name] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images },
  }
}

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const insight  = await loadInsight(slug)
  if (!insight) notFound()

  const articleJsonLd: Record<string, unknown> = {
    "@context":     "https://schema.org",
    "@type":        "Article",
    headline:       insight.title,
    description:    metaDescription(insight.excerpt, 300),
    url:            `${SITE_URL}/insights/${insight.slug}`,
    ...(insight.coverImage && { image: absoluteUrl(insight.coverImage) }),
    datePublished:  (insight.publishedAt ?? insight.createdAt).toISOString(),
    dateModified:   insight.updatedAt.toISOString(),
    ...(insight.author?.name && {
      author: {
        "@type": "Person",
        name:    insight.author.name,
        ...(insight.author.jobTitle && { jobTitle: insight.author.jobTitle }),
      },
    }),
    publisher: {
      "@type": "Organization",
      name:    SITE_NAME,
      url:     SITE_URL,
    },
    ...(insight.category?.name && { articleSection: insight.category.name }),
  }

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <InsightDetailClient />
    </>
  )
}
