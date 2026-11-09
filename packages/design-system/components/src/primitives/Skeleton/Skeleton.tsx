import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { useCSSVariable } from "../../hooks/useCSSVariable";
import "./Skeleton.css";

type SkeletonAnimationType = "shimmer" | "pulse" | "none";

type SkeletonProps = ComponentPropsWithoutRef<"div"> & {
  /** How it moves; by default the page's --terria-ds-skeleton-animation,
   * else shimmer */
  animationType?: SkeletonAnimationType;
};

const isAnimationType = (
  value: string | undefined
): value is SkeletonAnimationType =>
  value === "shimmer" || value === "pulse" || value === "none";

// A placeholder shape for content that's loading, sized by its own styles.
// One holding others shimmers once across all of them
const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ animationType, ...props }, ref) => {
    // The app's default, set once on the page
    const pageAnimation = useCSSVariable("--terria-ds-skeleton-animation");
    const animation =
      animationType ??
      (isAnimationType(pageAnimation) ? pageAnimation : "shimmer");

    return (
      <div
        {...props}
        ref={ref}
        data-tds="skeleton"
        data-tds-animation={animation}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
export type { SkeletonAnimationType, SkeletonProps };
