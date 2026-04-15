import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Verification - ARPS Institute",
  description:
    "Email verification required to access your programmes, certificates, and dashboard.",
};

export default function EmailVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
