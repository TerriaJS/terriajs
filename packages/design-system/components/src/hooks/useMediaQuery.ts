import { useCallback, useSyncExternalStore } from "react";

// Whether the media query matches, following it as it changes. False on the
// server
const useMediaQuery = (query: string): boolean => {
  // Stable per query: React resubscribes whenever this function changes
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => {
        list.removeEventListener("change", onChange);
      };
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
};

export { useMediaQuery };
