"use client";

import { useState, useEffect } from "react";

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
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Track mounted state to avoid hydration mismatch (hydration safety pattern)
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value (safe - only runs on mount/query change, not cascading)
    setMatches(mediaQuery.matches); // eslint-disable-line react-hooks/set-state-in-effect

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Fallback for older browsers
    else {
      // @ts-expect-error - deprecated but still needed for Safari < 14
      mediaQuery.addListener(handleChange);
      // @ts-expect-error - deprecated but still needed for Safari < 14
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  // Return false during SSR and first render to avoid hydration mismatch
  return mounted ? matches : false;
}
