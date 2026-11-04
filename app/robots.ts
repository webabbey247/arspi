import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

/** /robots.txt — tells crawlers where the sitemap is and keeps them off the
 *  authenticated and transactional areas. The dashboards are session-gated
 *  anyway (a crawler only ever gets a redirect), but spelling it out stops
 *  crawl budget being spent on them and keeps thin auth/success pages out of
 *  the index if anything ever links to one. */
export default function robots(): MetadataRoute.Robots {
  // Link-preview crawlers are allowed onto /verify/ even though search engines
  // are not. A shared certificate should render a proper card on LinkedIn or X,
  // and these bots obey robots.txt — without this they would be served a bare
  // URL. The page itself still sends `robots: noindex`, so a named individual's
  // certificate stays out of search results either way.
  const previewBots = [
    "LinkedInBot", "Twitterbot", "facebookexternalhit", "Slackbot-LinkExpanding",
    "WhatsApp", "TelegramBot", "Discordbot", "Iframely",
  ]

  return {
    rules: [
      ...previewBots.map(userAgent => ({ userAgent, allow: ["/verify/", "/"] })),
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
