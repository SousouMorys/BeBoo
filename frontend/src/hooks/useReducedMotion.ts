import { useEffect, useState } from 'react';

function systemPrefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Phase 1 receives the child preference from the local mock profile. The
 * public contract stays the same when the profile moves to the API in Phase 3.
 */
export function useReducedMotion(childPrefersReducedMotion = false): boolean {
  const [systemPreference, setSystemPreference] = useState(systemPrefersReducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setSystemPreference(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return childPrefersReducedMotion || systemPreference;
}
