"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionPayload } from "@/types/session";

// ─── Nav structure ────────────────────────────────────────────────────────────

type Role = SessionPayload["role"];

type NavEntry = {
  label: string;
  href: string;
  count?: string | number;
  countRed?: boolean;
  icon: React.ReactNode;
  role?: Role | Role[];
};

type NavSection = {
  section: string;
  role?: Role | Role[];
  items: NavEntry[];
};

const NAV: NavSection[] = [
  // ── Admin ────────────────────────────────────────────────────────────────────
  {
    section: "Overview",
    role: "ADMIN",
    items: [
      {
        label: "Dashboard",
        href: "/administrator",
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </>
        ),
      },
    ],
  },
  {
    section: "Content",
    role: "ADMIN",
    items: [
      {
        label: "Insights",
        href: "/administrator/insights",
        icon: (
          <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </>
        ),
      },
      {
        label: "Authors",
        href: "/administrator/authors",
        icon: (
          <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </>
        ),
      },
      {
        label: "Workshops",
        href: "/administrator/workshops",
        icon: (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        ),
      },
      {
        label: "Courses",
        href: "/administrator/courses",
        icon: (
          <>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </>
        ),
      },
    ],
  },
  {
    section: "Users",
    role: "ADMIN",
    items: [
      {
        label: "All Users",
        href: "/administrator/users",
        icon: (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        ),
      },
      {
        label: "Certificates",
        href: "/administrator/certificates",
        icon: (
          <>
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </>
        ),
      },
    ],
  },
  {
    section: "Communication",
    role: "ADMIN",
    items: [
      {
        label: "Enquiries",
        href: "/administrator/enquiries",
        icon: (
          <>
            <path d="M4 4h16v16H4z" />
            <path d="m22 6-10 7L2 6" />
          </>
        ),
      },
      {
        label: "Subscribers",
        href: "/administrator/subscribers",
        icon: (
          <>
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a2 2 0 0 0 3.4 0" />
          </>
        ),
      },
    ],
  },
  {
    section: "System",
    role: "ADMIN",
    items: [
      {
        label: "Settings",
        href: "/administrator/settings",
        icon: (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        ),
      },
    ],
  },

  // ── Instructor ───────────────────────────────────────────────────────────────
  {
    section: "Overview",
    role: "INSTRUCTOR",
    items: [
      {
        label: "Dashboard",
        href: "/instructor",
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </>
        ),
      },
    ],
  },
  {
    section: "Teaching",
    role: "INSTRUCTOR",
    items: [
      {
        label: "My Courses",
        href: "/instructor/courses",
        icon: (
          <>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </>
        ),
      },
      {
        label: "Students",
        href: "/instructor/students",
        icon: (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </>
        ),
      },
    ],
  },

  // ── Student ──────────────────────────────────────────────────────────────────
  {
    section: "Overview",
    role: "USER",
    items: [
      {
        label: "Dashboard",
        href: "/student",
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </>
        ),
      },
    ],
  },
  {
    section: "Learning",
    role: "USER",
    items: [
      {
        label: "My Courses",
        href: "/student/courses",
        icon: (
          <>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </>
        ),
      },
      {
        label: "Certificates",
        href: "/student/certificates",
        icon: (
          <>
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </>
        ),
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canAccess(allowed: Role | Role[] | undefined, userRole: Role): boolean {
  if (!allowed) return true;
  return Array.isArray(allowed) ? allowed.includes(userRole) : allowed === userRole;
}

function navItemClass(isActive: boolean) {
  const base =
    "flex items-center gap-[9px] px-[1.2rem] py-[9px] cursor-pointer font-body border-l-2 text-[0.82rem] font-light transition-all duration-[180ms] no-underline";
  return isActive
    ? `${base} bg-[#0474C4]/10 text-[#0474C4] border-l-[#0474C4]`
    : `${base} text-[#1A1916] border-l-transparent hover:bg-[rgba(247,243,237,0.04)] hover:text-[#0474C4] hover:border-l-[#0474C4]`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardSidebar = ({ userRole }: { userRole: Role }) => {
  const pathname = usePathname();

  const visibleSections = NAV
    .filter(s => canAccess(s.role, userRole))
    .map(s => ({
      ...s,
      items: s.items.filter(item => canAccess(item.role, userRole)),
    }))
    .filter(s => s.items.length > 0);

  return (
    <aside className="bg-white border-r border-[rgba(200,169,110,0.1)] py-4 flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0 w-56">
      {visibleSections.map(({ section, items }) => (
        <div key={section}>
          <span className="block text-[0.58rem] tracking-[0.18em] uppercase text-slate-400 px-[1.2rem] mt-4 mb-1.5">
            {section}
          </span>

          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={navItemClass(isActive)}>
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.75 h-3.75 stroke-current fill-none stroke-[1.6] shrink-0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.icon}
                </svg>

                {item.label}

                {item.count !== undefined && (
                  <span
                    className={`ml-auto text-[0.6rem] px-1.5 py-0.5 rounded-lg font-medium ${
                      item.countRed
                        ? "bg-[rgba(239,68,68,0.15)] text-[#FCA5A5]"
                        : "bg-[rgba(200,169,110,0.14)] text-[#C8A96E]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
};

export default DashboardSidebar;
