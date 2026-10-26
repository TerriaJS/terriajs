import { ScrollShadowRoot } from "./ScrollShadow";

// Compound component, assembled here so ScrollShadow.tsx only exports
// components
export const ScrollShadow = Object.assign(ScrollShadowRoot, {
  Root: ScrollShadowRoot
});

export { ScrollShadowRoot };
export { useScrollShadow } from "./useScrollShadow";
export type {
  ScrollShadowRootProps,
  ScrollShadowRootProps as ScrollShadowProps,
  ScrollShadowVisibility
} from "./ScrollShadow";
export type { UseScrollShadowProps } from "./useScrollShadow";
