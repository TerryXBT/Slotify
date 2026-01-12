'use client'

import { useMediaQuery } from './useMediaQuery'

export interface DeviceType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
}

/**
 * Custom hook to detect device type based on screen size
 *
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: 768px - 1023px
 * - Desktop: 1024px - 1535px
 * - Large Desktop: >= 1536px
 *
 * @returns DeviceType object with boolean flags for each device type
 *
 * @example
 * const { isMobile, isDesktop } = useDeviceType()
 *
 * return (
 *   <>
 *     {isMobile && <MobileNav />}
 *     {isDesktop && <DesktopNav />}
 *   </>
 * )
 */
export function useDeviceType(): DeviceType {
  // Tailwind breakpoints
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1535px)')
  const isLargeDesktop = useMediaQuery('(min-width: 1536px)')

  return {
    isMobile,
    isTablet,
    isDesktop: isDesktop || isLargeDesktop, // Consider both as desktop
    isLargeDesktop,
  }
}

/**
 * Simplified hook that returns true for mobile devices only
 * Useful for simple mobile/desktop switches
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

/**
 * Simplified hook that returns true for desktop devices (tablet and above)
 * Useful for simple mobile/desktop switches
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}
