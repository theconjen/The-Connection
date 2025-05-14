import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design - detects if a media query matches
 * 
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on server/during SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create the media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set the initial value
    setMatches(mediaQuery.matches);

    // Define the change handler to update state
    const handleResize = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleResize);
    } else {
      // Older browsers support
      mediaQuery.addListener(handleResize);
    }

    // Cleanup function
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleResize);
      } else {
        // Older browsers support
        mediaQuery.removeListener(handleResize);
      }
    };
  }, [query]);

  return matches;
}