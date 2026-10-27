"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader, { LogoutConfirm } from "./DashboardHeader";
import type { SessionPayload } from "@/types/session";

export default function DashboardShell({
  user,
  children,
}: {
  user: SessionPayload;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const pathname = usePathname();

  // Close the mobile sidebar on route change — adjusted during render (not an
  // effect) per React's guidance for resetting state when a prop changes.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setSidebarOpen(false);
  }

  useEffect(() => {
    if (sidebarOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [sidebarOpen]);

  // LMS app shell: full-height 250px sidebar beside a scrolling main column.
  // The header is a mobile-only bar (the sidebar becomes a drawer below `lg`).
  return (
    <div className="flex h-screen bg-[#F5F6FB] overflow-hidden">
      <DashboardSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => setConfirmLogout(true)}
      />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={() => setConfirmLogout(true)}
        />
        <main className="flex-1 overflow-y-auto w-full">{children}</main>
      </div>
      {confirmLogout && <LogoutConfirm onCancel={() => setConfirmLogout(false)} />}
    </div>
  );
}
