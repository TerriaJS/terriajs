import { useLayoutEffect, useObjectRef } from "@react-aria/utils";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties
} from "react";
import { useScrollShadow } from "./useScrollShadow";
import { dataAttr } from "../../utils/dataAttr";
import "./ScrollShadow.css";

// Ported from HeroUI v3's scroll-shadow.tsx, Copyright 2025 NextUI Inc.,
// Apache License 2.0, and modified (see THIRD_PARTY_NOTICES.md). The blur
// variant is ours, from the Figma file; HeroUI has only fade

type ScrollShadowVisibility =
  | "auto"
  | "both"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "none";

type ScrollShadowRootProps = ComponentPropsWithoutRef<"div"> & {
  /**
   * The scroll direction
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal";
  /**
   * How the ends show there's more: fading the content, or blurring it
   * @default "fade"
   */
  variant?: "fade" | "blur";
  /**
   * Hides the native scrollbar
   * @default false
   */
  hideScrollBar?: boolean;
  /**
   * The shadow size in pixels; by default the stylesheet's, 40px at the
   * default text size
   */
  size?: number;
  /**
   * The scroll offset before showing shadows, in pixels; by default none
   */
  offset?: number;
  /**
   * Controlled shadow visibility state
   * @default "auto"
   */
  visibility?: ScrollShadowVisibility;
  /**
   * Whether scroll shadow detection is enabled
   * @default true
   */
  isEnabled?: boolean;
  /**
   * Callback invoked when shadow visibility changes
   */
  onVisibilityChange?: (visibility: ScrollShadowVisibility) => void;
};

const ScrollShadowRoot = forwardRef<HTMLDivElement, ScrollShadowRootProps>(
  (
    {
      children,
      hideScrollBar = false,
      isEnabled = true,
      offset,
      onVisibilityChange,
      orientation = "vertical",
      size,
      style: styleProp,
      variant = "fade",
      visibility = "auto",
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useObjectRef(forwardedRef);

    useScrollShadow({
      containerRef: internalRef,
      isEnabled,
      offset: offset ?? 0,
      onVisibilityChange,
      orientation,
      visibility
    });

    // Handle controlled visibility mode, and detection turned off, which
    // would otherwise leave the last ends it found shadowed
    useLayoutEffect(() => {
      const el = internalRef.current;

      if (!el || (visibility === "auto" && isEnabled)) return;

      // Clear all data attributes
      delete el.dataset["topScroll"];
      delete el.dataset["bottomScroll"];
      delete el.dataset["topBottomScroll"];
      delete el.dataset["leftScroll"];
      delete el.dataset["rightScroll"];
      delete el.dataset["leftRightScroll"];

      // Set controlled visibility
      if (visibility === "both") {
        el.dataset[
          orientation === "vertical" ? "topBottomScroll" : "leftRightScroll"
        ] = "true";
      } else if (visibility !== "none" && visibility !== "auto") {
        el.dataset[`${visibility}Scroll`] = "true";
      }
    }, [internalRef, isEnabled, visibility, orientation]);

    // Not in HeroUI, which assumes a 10px scrollbar: the fade leaves the
    // scrollbar's strip solid, so it's measured. Scrollbars that overlay the
    // content, as on macOS, take no room, and leave no strip
    useLayoutEffect(() => {
      const el = internalRef.current;

      if (!el) return;

      const measure = (): void => {
        const css = getComputedStyle(el);
        const scrollbar =
          orientation === "vertical"
            ? el.offsetWidth -
              el.clientWidth -
              parseFloat(css.borderInlineStartWidth) -
              parseFloat(css.borderInlineEndWidth)
            : el.offsetHeight -
              el.clientHeight -
              parseFloat(css.borderBlockStartWidth) -
              parseFloat(css.borderBlockEndWidth);
        el.style.setProperty(
          "--terria-ds-scroll-shadow-scrollbar-size",
          `${String(Math.max(0, scrollbar))}px`
        );
      };

      measure();
      // The scrollbar coming or going resizes the content box
      const resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(el);

      return () => {
        resizeObserver.disconnect();
      };
    }, [internalRef, orientation, hideScrollBar]);

    // Set only when given, so the stylesheet's defaults apply otherwise
    const style = {
      ...(size === undefined
        ? null
        : { "--terria-ds-scroll-shadow-size": `${String(size)}px` }),
      ...(offset === undefined
        ? null
        : { "--terria-ds-scroll-shadow-offset": `${String(offset)}px` }),
      ...styleProp
    } as CSSProperties;

    return (
      <div
        // First, so a caller's data-tds can't replace the one its CSS keys on
        {...props}
        ref={internalRef}
        data-tds="scroll-shadow"
        data-tds-variant={variant}
        data-tds-hide-scrollbar={dataAttr(hideScrollBar)}
        data-orientation={orientation}
        // Selects the scroll-driven fade where supported. Controlled and
        // disabled modes stay attribute-driven, matching what the hook does
        // for the same combination of props.
        data-scroll-shadow-mode={
          isEnabled && visibility === "auto" ? "auto" : "manual"
        }
        style={style}
      >
        {children}
      </div>
    );
  }
);

ScrollShadowRoot.displayName = "ScrollShadow";

export { ScrollShadowRoot };
export type { ScrollShadowRootProps, ScrollShadowVisibility };
