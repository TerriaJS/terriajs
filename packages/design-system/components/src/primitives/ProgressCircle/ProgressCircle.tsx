import {
  forwardRef,
  createContext,
  useContext,
  type ComponentPropsWithoutRef
} from "react";
import {
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps,
  type ProgressBarRenderProps
} from "react-aria-components/ProgressBar";
import "./ProgressCircle.css";

const STROKE_WIDTH = 4;
const CENTER = 18;
const RADIUS = CENTER - STROKE_WIDTH / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// `current` follows the surrounding text color
export type ProgressCircleColor =
  | "accent"
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "current";
export type ProgressCircleSize = "sm" | "md" | "lg";

export type ProgressCircleProps = {
  color?: ProgressCircleColor;
  size?: ProgressCircleSize;
} & AriaProgressBarProps;

const ProgressCircleContext = createContext<ProgressBarRenderProps | null>(
  null
);

export const ProgressCircleRoot = ({
  color = "accent",
  size = "md",
  children,
  ...props
}: ProgressCircleProps): React.ReactElement => {
  return (
    <AriaProgressBar
      {...props}
      data-tds="progress-circle"
      data-tds-color={color}
      data-tds-size={size}
    >
      {(values) => (
        <ProgressCircleContext.Provider value={values}>
          {typeof children === "function" ? children(values) : children}
        </ProgressCircleContext.Provider>
      )}
    </AriaProgressBar>
  );
};

ProgressCircleRoot.displayName = "ProgressCircle";

export type ProgressCircleTrackProps = ComponentPropsWithoutRef<"svg">;

export const ProgressCircleTrack = forwardRef<
  SVGSVGElement,
  ProgressCircleTrackProps
>(({ children, ...props }, ref) => {
  return (
    <svg
      data-tds="progress-circle-track"
      fill="none"
      viewBox={`0 0 ${String(CENTER * 2)} ${String(CENTER * 2)}`}
      {...props}
      ref={ref}
    >
      {children}
    </svg>
  );
});

ProgressCircleTrack.displayName = "ProgressCircle.Track";

export type ProgressCircleTrackCircleProps = ComponentPropsWithoutRef<"circle">;

export const ProgressCircleTrackCircle = forwardRef<
  SVGCircleElement,
  ProgressCircleTrackCircleProps
>((props, ref) => {
  return (
    <circle
      data-tds="progress-circle-track-circle"
      cx={CENTER}
      cy={CENTER}
      r={RADIUS}
      strokeWidth={STROKE_WIDTH}
      {...props}
      ref={ref}
    />
  );
});

ProgressCircleTrackCircle.displayName = "ProgressCircle.TrackCircle";

export type ProgressCircleFillCircleProps = ComponentPropsWithoutRef<"circle">;

export const ProgressCircleFillCircle = forwardRef<
  SVGCircleElement,
  ProgressCircleFillCircleProps
>((props, ref) => {
  const state = useContext(ProgressCircleContext);
  const percentage = state?.percentage ?? 0;
  const isIndeterminate = state?.isIndeterminate ?? false;
  // Indeterminate shows a quarter arc that the track spins
  const strokeDashoffset = isIndeterminate
    ? CIRCUMFERENCE * 0.75
    : CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

  return (
    <circle
      data-tds="progress-circle-fill-circle"
      cx={CENTER}
      cy={CENTER}
      r={RADIUS}
      strokeDasharray={CIRCUMFERENCE}
      strokeDashoffset={strokeDashoffset}
      strokeLinecap="round"
      strokeWidth={STROKE_WIDTH}
      transform={`rotate(-90 ${String(CENTER)} ${String(CENTER)})`}
      {...props}
      ref={ref}
    />
  );
});

ProgressCircleFillCircle.displayName = "ProgressCircle.FillCircle";
