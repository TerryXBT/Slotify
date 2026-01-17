"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/useDeviceType";
import { DesktopLayout } from "./DesktopLayout";
import BottomNav from "@/components/BottomNav";

interface AppLayoutWrapperProps {
  children: ReactNode;
  userEmail?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export function AppLayoutWrapper({
  children,
  userEmail,
  displayName,
  avatarUrl,
}: AppLayoutWrapperProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Check if we're on onboarding page
  const isOnboarding = pathname?.includes("/onboarding");

  // Onboarding doesn't need layout wrapper
  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100 font-sans">
        {children}
      </div>
    );
  }

  // Desktop layout with sidebar
  if (!isMobile) {
    return (
      <DesktopLayout
        userEmail={userEmail}
        displayName={displayName}
        avatarUrl={avatarUrl}
      >
        {children}
      </DesktopLayout>
    );
  }

  // Mobile layout with bottom nav
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 font-sans">
      <main className="pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
