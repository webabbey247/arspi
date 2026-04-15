import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to access your programmes, certificates, and dashboard.",
};

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN:      "/administrator",
  INSTRUCTOR: "/instructor",
  USER:       "/student",
};

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) {
    redirect(ROLE_DASHBOARD[session.role] ?? "/student");
  }

  return <>{children}</>;
}
