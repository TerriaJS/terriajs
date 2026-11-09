import { filterDOMProps } from "@react-aria/utils";
import { forwardRef, type CSSProperties } from "react";
import {
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps
} from "react-aria-components/ProgressBar";
import "./Spinner.css";

// `current` follows the surrounding text color
type SpinnerColor = "accent" | "current" | "success" | "warning" | "danger";
type SpinnerSize = "sm" | "md" | "lg";

type SpinnerProps = {
  color?: SpinnerColor;
  size?: SpinnerSize;
  /** Only decoration, beside text that says what's loading */
  "aria-hidden"?: boolean | "true" | "false";
  // Plain, not React Aria's functions of its state: an indeterminate one's
  // state never changes
  className?: string;
  style?: CSSProperties;
} & Omit<
  AriaProgressBarProps,
  | "children"
  | "value"
  | "minValue"
  | "maxValue"
  | "isIndeterminate"
  | "formatOptions"
  | "valueLabel"
  | "className"
  | "style"
>;

// Loading with no known progress: an indeterminate progressbar, so it needs
// an aria-label; or, beside text that says what's loading, only decoration,
// with aria-hidden
const Spinner = forwardRef<HTMLElement, SpinnerProps>(
  ({ color = "accent", size = "md", "aria-hidden": hidden, ...props }, ref) => {
    // Hidden, a span, so it can sit in a line of text, in a <p>
    if (hidden === true || hidden === "true") {
      return (
        <span
          // React Aria's progressbar drops aria-hidden, so hidden it's a
          // plain element: decoration, not a second announcement of the text
          // beside it
          {...filterDOMProps(props, { global: true, events: true })}
          ref={ref}
          aria-hidden="true"
          className={props.className}
          style={props.style}
          data-tds="spinner"
          data-tds-color={color}
          data-tds-size={size}
        />
      );
    }

    return (
      <AriaProgressBar
        {...props}
        // React Aria's progressbar is a div, which the element ref takes
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        isIndeterminate
        data-tds="spinner"
        data-tds-color={color}
        data-tds-size={size}
      />
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner };
export type { SpinnerColor, SpinnerProps, SpinnerSize };
