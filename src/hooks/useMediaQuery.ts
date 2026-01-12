'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive design using media queries
 *
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns boolean - true if the media query matches
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 * const isMobile = useMediaQuery('(max-width: 767px)')
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false to avoid hydration mismatch
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if window is available (client-side only)
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQuery.matches)

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Fallback for older browsers
    else {
      // @ts-ignore - deprecated but still needed for Safari < 14
      mediaQuery.addListener(handleChange)
      // @ts-ignore
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [query])

  // Return false during SSR and first render to avoid hydration mismatch
  return mounted ? matches : false
}
