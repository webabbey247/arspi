import type { Metadata } from "next"

/** Marks the auth routes noindex — login/register/reset-password/
 *  email-verification are all client components, which can't export metadata
 *  themselves — and scopes the LMS theme (see app/lms-theme.css) to them. The
 *  visual shell for these pages still comes from each page's own
 *  `withAuthLayout` HOC. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="lms-theme">{children}</div>
}
