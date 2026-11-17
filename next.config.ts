import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production"

const nextConfig: NextConfig = {
  // Produce a self-contained server in .next/standalone — required for shared/cPanel
  // hosting. Must NOT be set when building on Vercel: standalone mode changes where
  // Next.js writes its build output, so Vercel's own builder never finds the
  // `next-server.js.nft.json` trace file it expects and the build fails with
  // `ENOENT ... next-server.js.nft.json`. Vercel sets the VERCEL env var during its
  // build, so this only applies "standalone" for other hosts.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),

  // Don't advertise the framework/version via the X-Powered-By response header.
  poweredByHeader: false,

  // nodemailer uses Node.js built-ins that Turbopack must not bundle.
  serverExternalPackages: ["nodemailer", "uploadthing", "@uploadthing/shared", "@prisma/adapter-pg", "pg", "@react-pdf/renderer", "canvas"],
  images: {
    remotePatterns: [
      // UploadThing CDN
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "**.ufs.sh" },
    ],
  },

  // Baseline security headers on every response (see the CSP and HSTS notes below).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // A deliberately narrow CSP: the directives that are safe for every
          // page and embed. No plugins, no <base> hijacking, no framing by
          // other sites. A script-src policy would need nonces on Next's own
          // inline scripts plus allowlisting every embed — left for later.
          {
            key: "Content-Security-Policy",
            value: [
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
              ...(isProd ? ["upgrade-insecure-requests"] : []),
            ].join("; "),
          },
          // HTTPS-only for returning visitors. Production only (localhost is
          // http), a modest max-age, no includeSubDomains/preload — easy to
          // back out if a subdomain ever needs plain http.
          ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=15552000" }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
