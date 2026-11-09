import { useMemo } from "react";
import { useIsSSR } from "react-aria/SSRProvider";

// A custom property set on the page, so apps can change a component's default
// once in CSS. Read when the component mounts; unknown on the server
const useCSSVariable = (name: string): string | undefined => {
  const isSSR = useIsSSR();
  return useMemo(
    () =>
      isSSR
        ? undefined
        : getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim() || undefined,
    [name, isSSR]
  );
};

export { useCSSVariable };
