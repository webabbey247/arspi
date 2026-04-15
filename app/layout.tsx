import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
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
  title: {
    default: "ARPS Institute — Professional Education, Research & Leadership",
    template: "%s — ARPS Institute",
  },
  description:
    "Global professional certification programs, research training, software solutions, and institutional consulting for scholars and practitioners worldwide.",
  keywords: [
    "ARPS Institute",
    "professional education",
    "research training",
    "M&E",
    "certificates",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://arpsinstitute.org",
    siteName: "ARPS Institute",
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
      </body>
    </html>
  );
}
