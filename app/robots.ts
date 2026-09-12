import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

/** /robots.txt — tells crawlers where the sitemap is and keeps them off the
 *  authenticated and transactional areas. The dashboards are session-gated
 *  anyway (a crawler only ever gets a redirect), but spelling it out stops
 *  crawl budget being spent on them and keeps thin auth/success pages out of
 *  the index if anything ever links to one. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/administrator/",
          "/instructor/",
          "/student/",
          "/settings",
          "/login",
          "/register",
          "/reset-password",
          "/email-verification",
          "/unauthorized",
          "/verify/",           // per-certificate verification pages
          "/programs/success",
          "/workshop/success",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
