import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insights & Research",
  description:
    "Research articles, practice guides, expert perspectives, and news from the ARPS Institute team and global network of scholars.",
};

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
