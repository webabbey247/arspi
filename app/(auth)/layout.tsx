import type { Metadata } from "next"

/** Pass-through layout that exists purely to mark the auth routes noindex —
 *  login/register/reset-password/email-verification are all client components,
 *  which can't export metadata themselves. The visual shell for these pages
 *  still comes from each page's own `withAuthLayout` HOC. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
