import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workshops & Events",
  description:
    "Join ARPS Institute live workshops and expert sessions — free and paid events open to all professionals worldwide.",
};

export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
