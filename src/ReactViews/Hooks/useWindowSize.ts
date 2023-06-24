// Generalised measure logic out of measureElement.js into this hook
import { useState, useEffect } from "react";

// we(i) like 300ms for debounces
export const terriaDebounceTime = 300;

const inferWidth = () =>
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth ||
  0;

interface UseWindowSizeOptions {
  debounceOverride?: number;
  // trackHeight: boolean; // add a track height if we ever need it.
}

export function useWindowSize({ debounceOverride }: UseWindowSizeOptions) {
  const [width, setWidth] = useState(inferWidth());
  const debounceLength = debounceOverride || terriaDebounceTime;

  useEffect(() => {
    let timeoutId: any = null;
    const resizeListener = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setWidth(inferWidth()), debounceLength);
    };
    window.addEventListener("resize", resizeListener);

    // will ensure no leak
    return () => {
      window.removeEventListener("resize", resizeListener);
    };
  }, []);

  return width;
}
