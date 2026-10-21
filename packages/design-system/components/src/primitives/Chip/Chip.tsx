import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import type { DOMRenderProps } from "react-aria-components";
import "./Chip.css";

export type ChipColor = "default" | "accent" | "success" | "warning" | "danger";
export type ChipVariant = "primary" | "secondary" | "tertiary" | "soft";
export type ChipSize = "sm" | "md" | "lg";

// Like react-aria components, each part takes `render` to swap in a custom
// element. Parts use forwardRef: React 18 doesn't pass `ref` to plain function
// components. `color` is dropped from the span's own attributes, as the
// chip's colour prop replaces it
type SpanProps = Omit<ComponentPropsWithoutRef<"span">, "color"> &
  DOMRenderProps<"span", undefined>;

export type ChipProps = SpanProps & {
  color?: ChipColor;
  variant?: ChipVariant;
  size?: ChipSize;
};

// A compact label for a category, status or attribute
export const ChipRoot = forwardRef<HTMLSpanElement, ChipProps>(
  (
    {
      color = "default",
      variant = "secondary",
      size = "md",
      children,
      render,
      ...props
    },
    ref
  ) => {
    // Text goes in a Chip.Label; icons and custom parts go in as they are
    const content =
      typeof children === "string" || typeof children === "number" ? (
        <ChipLabel>{children}</ChipLabel>
      ) : (
        children
      );
    const chipProps = {
      ...props,
      ref,
      "data-tds": "chip",
      "data-tds-color": color,
      "data-tds-variant": variant,
      "data-tds-size": size
    };

    return render ? (
      render({ ...chipProps, children: content }, undefined)
    ) : (
      <span {...chipProps}>{content}</span>
    );
  }
);

ChipRoot.displayName = "Chip";

export type ChipLabelProps = SpanProps & { children: ReactNode };

export const ChipLabel = forwardRef<HTMLSpanElement, ChipLabelProps>(
  ({ render, ...props }, ref) => {
    const labelProps = { ...props, ref, "data-tds": "chip-label" };
    return render ? render(labelProps, undefined) : <span {...labelProps} />;
  }
);

ChipLabel.displayName = "Chip.Label";
