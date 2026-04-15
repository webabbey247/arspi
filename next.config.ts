import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server in .next/standalone — required for shared hosting
  output: "standalone",

  // nodemailer uses Node.js built-ins that Turbopack must not bundle
  serverExternalPackages: ["nodemailer", "uploadthing", "@uploadthing/shared", "@prisma/adapter-pg", "pg"],
  images: {
    remotePatterns: [
      // UploadThing CDN
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "**.ufs.sh" },
    ],
  },
};

export default nextConfig;
