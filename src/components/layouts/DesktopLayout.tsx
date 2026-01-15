"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, Briefcase, Settings, LogOut } from "lucide-react";
import clsx from "clsx";

interface DesktopLayoutProps {
  children: ReactNode;
  userEmail?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Desktop Layout Component
 *
 * Provides the desktop-specific layout structure with:
 * - Sidebar navigation
 * - Top header bar
 * - Wider content area with max-width constraint
 * - Better use of horizontal space
 *
 * @param children - Content to render
 * @param userEmail - User's email for display
 * @param displayName - User's display name
 * @param avatarUrl - User's avatar URL
 */
export function DesktopLayout({
  children,
  userEmail,
  displayName,
  avatarUrl: _avatarUrl,
}: DesktopLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/app", icon: Home, label: "Home", exact: true },
    { href: "/app/week", icon: Calendar, label: "Calendar", exact: false },
    { href: "/app/services", icon: Briefcase, label: "Services", exact: false },
    { href: "/app/settings", icon: Settings, label: "Settings", exact: false },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/app" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="text-xl font-bold">Slotify</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                  active
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-white shadow-lg shadow-blue-900/20"
                    : "hover:bg-white/5 text-gray-400 hover:text-white",
                )}
              >
                <Icon
                  className={clsx(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    active && "text-blue-400",
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-semibold text-sm">
              {displayName?.[0]?.toUpperCase() ||
                userEmail?.[0]?.toUpperCase() ||
                "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {displayName || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>

          {/* Logout Button */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/10 transition-colors group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Logout</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/10 bg-[#1a1a1a]/80 backdrop-blur-lg px-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {pathname === "/app"
                ? "Dashboard"
                : pathname?.includes("/week")
                  ? "Calendar"
                  : pathname?.includes("/services")
                    ? "Services"
                    : pathname?.includes("/settings")
                      ? "Settings"
                      : "Slotify"}
            </h1>
          </div>

          {/* Future: Search bar, notifications, etc. */}
          <div className="flex items-center gap-4">
            {/* Placeholder for future features */}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
          <div className="container mx-auto max-w-7xl p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
