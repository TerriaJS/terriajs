import { filterDOMProps } from "@react-aria/utils";
import { forwardRef, type CSSProperties } from "react";
import {
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps
} from "react-aria-components/ProgressBar";
import "./AIActivityIndicator.css";

type AIActivityIndicatorSize = "sm" | "md" | "lg";
type AIActivityIndicatorSparkles = 4 | 5 | 6;

type AIActivityIndicatorProps = {
  size?: AIActivityIndicatorSize;
  /**
   * How many sparkles pulse along the wave; fewer are drawn larger
   * @default 6
   */
  sparkles?: AIActivityIndicatorSparkles;
  /** Only decoration, beside text that says what's happening */
  "aria-hidden"?: boolean | "true" | "false";
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

// A four-pointed sparkle, 20 units across, centred on its origin
const SPARKLE =
  "M0,-10 C1.2,-2.5 2.5,-1.2 10,0 C2.5,1.2 1.2,2.5 0,10 C-1.2,2.5 -2.5,1.2 -10,0 C-2.5,-1.2 -1.2,-2.5 0,-10Z";

// The sparkles, spaced evenly along the design's wave, each sized by how thick
// the wave is there, and larger when there are fewer; with the bounds they
// fill. Worked out once, from the curve, as the design does it
const LAYOUTS: Record<
  AIActivityIndicatorSparkles,
  { viewBox: string; sparkles: { x: number; y: number; scale: number }[] }
> = {
  4: {
    viewBox: "4.2 5.2 256.8 99.2",
    sparkles: [
      { x: 30, y: 78.6, scale: 2.384 },
      { x: 101.67, y: 36.1, scale: 2.887 },
      { x: 173.33, y: 58.37, scale: 3.861 },
      { x: 245, y: 74.6, scale: 1.395 }
    ]
  },
  5: {
    viewBox: "7 7.7 252.4 93.9",
    sparkles: [
      { x: 30, y: 78.6, scale: 2.102 },
      { x: 83.75, y: 41.49, scale: 2.436 },
      { x: 137.5, y: 44, scale: 3.432 },
      { x: 191.25, y: 63.79, scale: 2.943 },
      { x: 245, y: 74.6, scale: 1.237 }
    ]
  },
  6: {
    viewBox: "11 12 246.3 85.7",
    sparkles: [
      { x: 30, y: 78.6, scale: 1.703 },
      { x: 73, y: 46.79, scale: 1.933 },
      { x: 116, y: 36.75, scale: 2.278 },
      { x: 159, y: 53.4, scale: 2.86 },
      { x: 202, y: 66.79, scale: 2.111 },
      { x: 245, y: 74.6, scale: 1.024 }
    ]
  }
};

// AI at work, with no known progress: sparkles along a wave, pulsing one after
// another. An indeterminate progressbar, as Spinner is, so it needs an
// aria-label; or, beside text that says what's happening, only decoration,
// with aria-hidden
const AIActivityIndicator = forwardRef<HTMLElement, AIActivityIndicatorProps>(
  ({ size = "md", sparkles = 6, "aria-hidden": hidden, ...props }, ref) => {
    const { viewBox, sparkles: layout } = LAYOUTS[sparkles];
    const drawing = (
      <svg viewBox={viewBox} aria-hidden="true" focusable="false">
        {layout.map(({ x, y, scale }, index) => (
          <g
            key={x}
            transform={`translate(${String(x)} ${String(y)}) scale(${String(scale)})`}
            // How far into the cycle this one starts, so the pulse travels
            // along the wave; a custom property isn't one of CSSProperties' keys
            style={
              {
                "--_ai-indicator-offset": index / layout.length - 1
              } as CSSProperties
            }
          >
            <path d={SPARKLE} />
          </g>
        ))}
      </svg>
    );

    // React Aria's progressbar drops aria-hidden, so hidden it's a plain
    // element: decoration, not a second announcement of the text beside it.
    // A span, so it can sit in a line of text, in a <p>
    if (hidden === true || hidden === "true") {
      // The progressbar's own props it would put on its element: an id, data
      // attributes, events. A function className or style is called as the
      // progressbar would: indeterminate, with no value
      const { className, style } = props;
      const values = {
        isIndeterminate: true,
        percentage: undefined,
        valueText: undefined
      };
      return (
        <span
          {...filterDOMProps(props, { global: true, events: true })}
          ref={ref}
          aria-hidden="true"
          className={
            typeof className === "function"
              ? className({ ...values, defaultClassName: undefined })
              : className
          }
          style={
            typeof style === "function"
              ? style({ ...values, defaultStyle: {} })
              : style
          }
          data-tds="ai-activity-indicator"
          data-tds-size={size}
        >
          {drawing}
        </span>
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
        data-tds="ai-activity-indicator"
        data-tds-size={size}
      >
        {drawing}
      </AriaProgressBar>
    );
  }
);

AIActivityIndicator.displayName = "AIActivityIndicator";

export { AIActivityIndicator };
export type {
  AIActivityIndicatorProps,
  AIActivityIndicatorSize,
  AIActivityIndicatorSparkles
};
