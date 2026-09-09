import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server in .next/standalone — required for shared hosting
  output: "standalone",

  // Don't advertise the framework/version via the X-Powered-By response header.
  poweredByHeader: false,

  // nodemailer uses Node.js built-ins that Turbopack must not bundle.
  // isomorphic-dompurify pulls in jsdom, whose html-encoding-sniffer dep does a
  // CJS require() of the ESM-only @exodus/bytes — Turbopack's bundled require
  // shim can't do that interop (Node's own runtime can), so it must stay external.
  serverExternalPackages: ["nodemailer", "uploadthing", "@uploadthing/shared", "@prisma/adapter-pg", "pg", "@react-pdf/renderer", "canvas", "isomorphic-dompurify", "jsdom"],
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
