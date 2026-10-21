import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import type { DOMRenderProps } from "react-aria-components";
import "./Badge.css";

export type BadgeColor =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger";
export type BadgeVariant = "primary" | "secondary" | "soft";
export type BadgeSize = "sm" | "md" | "lg";
export type BadgePlacement =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

// Like react-aria components, each part takes `render` to swap in a custom
// element. Parts use forwardRef: React 18 doesn't pass `ref` to plain function
// components. `color` is dropped from the span's own attributes, as the
// badge's colour prop replaces it
type SpanProps = Omit<ComponentPropsWithoutRef<"span">, "color"> &
  DOMRenderProps<"span", undefined>;

export type BadgeProps = SpanProps & {
  color?: BadgeColor;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** The corner of its Badge.Anchor it sits on */
  placement?: BadgePlacement;
};

// A count or short status on a corner of a Badge.Anchor
export const BadgeRoot = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      color = "default",
      variant = "primary",
      size = "md",
      placement = "top-right",
      children,
      render,
      ...props
    },
    ref
  ) => {
    // Text goes in a Badge.Label; icons and custom parts go in as they are
    const content =
      typeof children === "string" || typeof children === "number" ? (
        <BadgeLabel>{children}</BadgeLabel>
      ) : (
        children
      );
    const badgeProps = {
      ...props,
      ref,
      "data-tds": "badge",
      "data-tds-color": color,
      "data-tds-variant": variant,
      "data-tds-size": size,
      "data-tds-placement": placement
    };

    return render ? (
      render({ ...badgeProps, children: content }, undefined)
    ) : (
      <span {...badgeProps}>{content}</span>
    );
  }
);

BadgeRoot.displayName = "Badge";

export type BadgeLabelProps = SpanProps & { children: ReactNode };

export const BadgeLabel = forwardRef<HTMLSpanElement, BadgeLabelProps>(
  ({ render, ...props }, ref) => {
    const labelProps = { ...props, ref, "data-tds": "badge-label" };
    return render ? render(labelProps, undefined) : <span {...labelProps} />;
  }
);

BadgeLabel.displayName = "Badge.Label";

export type BadgeAnchorProps = SpanProps & { children: ReactNode };

// Wraps the element a Badge sits on, like an avatar or icon button
export const BadgeAnchor = forwardRef<HTMLSpanElement, BadgeAnchorProps>(
  ({ render, ...props }, ref) => {
    const anchorProps = { ...props, ref, "data-tds": "badge-anchor" };
    return render ? render(anchorProps, undefined) : <span {...anchorProps} />;
  }
);

BadgeAnchor.displayName = "Badge.Anchor";
