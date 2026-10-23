import { forwardRef } from "react";
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
} & Omit<
  AriaProgressBarProps,
  | "children"
  | "value"
  | "minValue"
  | "maxValue"
  | "isIndeterminate"
  | "formatOptions"
  | "valueLabel"
>;

// Loading with no known progress: an indeterminate progressbar, so it needs
// an aria-label
const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ color = "accent", size = "md", ...props }, ref) => {
    return (
      <AriaProgressBar
        {...props}
        ref={ref}
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
