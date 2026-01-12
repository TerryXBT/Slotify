'use client'

import { ReactNode } from 'react'
import { useIsMobile } from '@/hooks/useDeviceType'
import { MobileLayout } from './MobileLayout'
import { DesktopLayout } from './DesktopLayout'

interface ResponsiveLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
  userEmail?: string | null
  displayName?: string | null
  avatarUrl?: string | null
}

/**
 * Responsive Layout Wrapper
 *
 * Automatically switches between mobile and desktop layouts
 * based on screen size. This is the main layout component
 * that should wrap your page content.
 *
 * Features:
 * - Detects device type using media queries
 * - Renders appropriate layout (mobile or desktop)
 * - Handles SSR/hydration correctly
 * - No layout shift during hydration
 *
 * @param children - Page content to render
 * @param showBottomNav - Show bottom navigation on mobile (default: true)
 * @param userEmail - User's email for desktop layout
 * @param displayName - User's display name for desktop layout
 * @param avatarUrl - User's avatar URL for desktop layout
 *
 * @example
 * <ResponsiveLayout userEmail={user.email} displayName={user.name}>
 *   <YourPageContent />
 * </ResponsiveLayout>
 */
export function ResponsiveLayout({
  children,
  showBottomNav = true,
  userEmail,
  displayName,
  avatarUrl,
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile()

  // During SSR and first render, show mobile layout to avoid hydration mismatch
  // The hook will return false until mounted
  if (isMobile || typeof window === 'undefined') {
    return <MobileLayout showBottomNav={showBottomNav}>{children}</MobileLayout>
  }

  return (
    <DesktopLayout
      userEmail={userEmail}
      displayName={displayName}
      avatarUrl={avatarUrl}
    >
      {children}
    </DesktopLayout>
  )
}
