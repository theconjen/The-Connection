import { useState, useEffect } from "react";

/**
 * Hook to detect if a media query matches
 * @param query The media query to check (e.g. "(max-width: 768px)")
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with server-safe check (mobile-first approach)
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  useEffect(() => {
    // Define the media query list
    const mediaQuery = window.matchMedia(query);
    
    // Update the state with the match status
    const updateMatches = () => {
      setMatches(mediaQuery.matches);
    };
    
    // Call updateMatches() initially as addEventListener 
    // doesn't call the listener initially
    updateMatches();
    
    // Add event listener
    mediaQuery.addEventListener('change', updateMatches);
    
    // Clean up the event listener
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]);

  return matches;
}

export default useMediaQuery;