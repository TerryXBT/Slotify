'use client'

import { ReactNode } from 'react'

interface MobileLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

/**
 * Mobile Layout Component
 *
 * Provides the mobile-specific layout structure with:
 * - Full screen display
 * - Bottom navigation (optional)
 * - Safe area padding for notch/home indicator
 *
 * @param children - Content to render
 * @param showBottomNav - Whether to show bottom navigation (default: true)
 */
export function MobileLayout({ children, showBottomNav = true }: MobileLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-white">
      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${showBottomNav ? 'pb-24' : 'pb-safe'}`}>
        {children}
      </main>

      {/* Bottom Navigation Spacer (actual nav rendered separately) */}
      {showBottomNav && <div className="h-24" />}
    </div>
  )
}
