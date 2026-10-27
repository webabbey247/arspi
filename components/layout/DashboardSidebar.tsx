"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { BrandMark } from "./DashboardHeader";
import { cn } from "@/lib/utils";
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
        label: "Programs",
        href: "/administrator/programs",
        icon: (
          <>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </>
        ),
      },
      {
        label: "Careers",
        href: "/administrator/careers",
        icon: (
          <>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </>
        ),
      },
      {
        label: "Team",
        href: "/administrator/team",
        icon: (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        ),
      },
      {
        label: "Research Projects",
        href: "/administrator/projects",
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </>
        ),
      },
      {
        label: "Organizations",
        href: "/administrator/organizations",
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6" />
            <path d="M9 13h6" />
            <path d="M9 17h3" />
          </>
        ),
      },
      {
        label: "Global Offices",
        href: "/administrator/global-offices",
        icon: (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
        href: "/settings",
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
        label: "My Programs",
        href: "/instructor/programs",
        icon: (
          <>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </>
        ),
      },
      {
        label: "My Workshops",
        href: "/instructor/workshops",
        icon: (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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
  {
    section: "System",
    role: "INSTRUCTOR",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
        label: "My Programs",
        href: "/student/programs",
        icon: (
          <>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </>
        ),
      },
      {
        label: "My Workshops",
        href: "/student/workshops",
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
  {
    section: "System",
    role: "USER",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
    "flex items-center gap-3 px-[13px] py-[10px] rounded-[10px] cursor-pointer text-[14px] font-bold transition-colors duration-[180ms] no-underline";
  return isActive
    ? `${base} bg-[#EEECFF] text-[#6655DF]`
    : `${base} text-[#60677E] hover:bg-[#EEECFF] hover:text-[#6655DF]`;
}

const ROLE_HOME: Record<Role, string> = {
  ADMIN:      "/administrator",
  INSTRUCTOR: "/instructor",
  USER:       "/student",
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN:      "Administrator",
  INSTRUCTOR: "Instructor",
  USER:       "Learner",
};

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardSidebar = ({
  user,
  isOpen = false,
  onClose,
  onLogout,
}: {
  user: SessionPayload;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout: () => void;
}) => {
  const pathname = usePathname();
  const userRole = user.role;

  const visibleSections = NAV
    .filter(s => canAccess(s.role, userRole))
    .map(s => ({
      ...s,
      items: s.items.filter(item => canAccess(item.role, userRole)),
    }))
    .filter(s => s.items.length > 0);

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "lg:hidden fixed inset-0 z-140 bg-[#171C35]/40 backdrop-blur-[1px] transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        className={cn(
          "bg-white border-r border-[#DFE2ED] px-4 py-6 flex flex-col overflow-hidden shrink-0 w-[270px] h-screen",
          // Mobile: fixed drawer
          "fixed top-0 left-0 z-150 transform transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: static 250px column, as in the LMS app shell
          "lg:static lg:translate-x-0 lg:w-[250px] lg:z-auto"
        )}
      >
        {/* Brand */}
        <div className="flex items-start justify-between gap-2 px-2.5 pb-7">
          <Link href={ROLE_HOME[userRole]} className="flex items-center gap-3 no-underline min-w-0">
            <BrandMark />
            <b className="text-[19px] leading-[1.1] text-[#171C35]">
              ARPS Institute
              <small className="block text-[10px] tracking-[0.12em] text-[#6655DF] mt-1 uppercase">
                {ROLE_LABEL[userRole]} workspace
              </small>
            </b>
          </Link>
          {/* Mobile-only close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden w-8 h-8 inline-flex items-center justify-center rounded-[10px] text-[#69708A] hover:bg-[#EEECFF] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="lms-sidebar-nav flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
          {visibleSections.map(({ section, items }, i) => (
            <div key={section} className={i > 0 ? "mt-5" : undefined}>
              <span className="block text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6] px-[13px] mb-1.5">
                {section}
              </span>

              <div className="grid gap-1.5">
                {items.map((item) => {
                  // A single-segment href (e.g. "/administrator", the section's own
                  // "Dashboard" entry) is a path prefix of every other page in that
                  // section, so it must match exactly — otherwise "Dashboard" stays
                  // highlighted no matter which page you're actually on. Deeper
                  // hrefs (e.g. "/administrator/programs") still match their own
                  // sub-pages, respecting a "/" boundary so a sibling path that
                  // merely starts with the same characters doesn't false-match.
                  const isRootLevel = item.href.split("/").filter(Boolean).length <= 1;
                  const isActive = isRootLevel
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link key={item.href} href={item.href} className={navItemClass(isActive)}>
                      <svg
                        viewBox="0 0 24 24"
                        className="w-[19px] h-[19px] stroke-current fill-none stroke-[1.8] shrink-0"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {item.icon}
                      </svg>

                      {item.label}

                      {item.count !== undefined && (
                        <span
                          className={`ml-auto text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                            item.countRed
                              ? "bg-red-50 text-red-600"
                              : "bg-[#EEECFF] text-[#6655DF]"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Role card */}
        <div className="mt-4 border-t border-[#DFE2ED] pt-4.5 px-2.5 grid gap-2">
          <Link href="/settings" className="grid no-underline min-w-0">
            <b className="text-[14px] text-[#171C35] truncate">{displayName}</b>
            <span className="text-[12px] text-[#69708A]">{ROLE_LABEL[userRole]}</span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 w-fit text-[13px] font-bold text-[#6655DF] hover:text-[#2C2368] cursor-pointer"
          >
            <LogOut className="w-3.75 h-3.75" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
