import { useLayoutEffect } from "@react-aria/utils";
import { useCallback, useEffect, useState, type RefObject } from "react";

// An element's natural height, measured with its own height released, kept
// up to date as its content or width changes
const useMeasuredHeight = (
  ref: RefObject<HTMLDivElement | null>
): { height: number | undefined } => {
  const [height, setHeight] = useState<number | undefined>(undefined);

  const calculateHeight = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const previousHeight = element.style.height;
    element.style.height = "auto";
    const measuredHeight = element.scrollHeight;
    element.style.height = previousHeight;

    setHeight((prev) => (prev !== measuredHeight ? measuredHeight : prev));
  }, [ref]);

  useLayoutEffect(() => {
    calculateHeight();
  }, [calculateHeight]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let measureFrame = 0;
    const scheduleMeasure = (): void => {
      if (measureFrame) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0;
        calculateHeight();
      });
    };

    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(element, {
      attributeFilter: ["class"],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    });

    // Content reflowing at a new width changes the height without touching
    // the DOM. Only the inline axis is watched: the block axis transitions,
    // and reacting to it would re-measure on every frame
    let lastWidth = element.getBoundingClientRect().width;
    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width === undefined || Math.abs(width - lastWidth) < 0.5) return;
      lastWidth = width;
      scheduleMeasure();
    });
    resizeObserver.observe(element);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      cancelAnimationFrame(measureFrame);
    };
  }, [ref, calculateHeight]);

  return { height };
};

export { useMeasuredHeight };
