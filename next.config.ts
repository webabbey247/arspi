import type { NextConfig } from "next";

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

  // Baseline security headers on every response. Not included: Content-Security-Policy
  // (needs deliberate allowlisting against every third-party embed this app uses —
  // Stripe Checkout, UploadThing, YouTube/Vimeo, Google Forms/Typeform survey blocks —
  // and Strict-Transport-Security (best set at the reverse proxy / hosting layer, since
  // an incorrect max-age is hard for users to undo once a browser has cached it).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
