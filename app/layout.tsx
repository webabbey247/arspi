import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, organizationJsonLd } from "@/lib/seo";
import "./globals.css";


const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  // Required for Next.js to resolve relative OG/Twitter image paths and
  // canonicals to absolute URLs — without it they silently fall back to
  // localhost, which then ends up in social previews and search results.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ARPS Institute — Professional Education, Research & Leadership",
    template: "%s — ARPS Institute",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "ARPS Institute",
    "professional education",
    "research training",
    "M&E",
    "certificates",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "ARPS Institute — Professional Education, Research & Leadership",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "ARPS Institute — Professional Education, Research & Leadership",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfairDisplay.variable} ${dmSans.variable} w-full h-full antialiased`}
      >
       {children}
        <Toaster position="bottom-right" richColors />
        <JsonLd data={organizationJsonLd()} />
      </body>
    </html>
  );
}
