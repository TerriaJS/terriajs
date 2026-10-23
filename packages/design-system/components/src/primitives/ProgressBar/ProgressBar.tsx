import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef
} from "react";
import {
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps,
  type ProgressBarRenderProps
} from "react-aria-components/ProgressBar";
import "./ProgressBar.css";

export type ProgressBarColor =
  | "accent"
  | "default"
  | "success"
  | "warning"
  | "danger";
export type ProgressBarSize = "sm" | "md" | "lg";

export type ProgressBarProps = {
  color?: ProgressBarColor;
  size?: ProgressBarSize;
} & AriaProgressBarProps;

const ProgressBarContext = createContext<ProgressBarRenderProps | null>(null);

// A Label names it; its parts read the value from here
export const ProgressBarRoot = ({
  color = "accent",
  size = "md",
  children,
  ...props
}: ProgressBarProps): React.ReactElement => {
  return (
    <AriaProgressBar
      {...props}
      data-tds="progress-bar"
      data-tds-color={color}
      data-tds-size={size}
    >
      {(values) => (
        <ProgressBarContext.Provider value={values}>
          {typeof children === "function" ? children(values) : children}
        </ProgressBarContext.Provider>
      )}
    </AriaProgressBar>
  );
};

ProgressBarRoot.displayName = "ProgressBar";

export type ProgressBarOutputProps = ComponentPropsWithoutRef<"span">;

// The value as text, like 60%; empty while indeterminate
export const ProgressBarOutput = forwardRef<
  HTMLSpanElement,
  ProgressBarOutputProps
>(({ children, ...props }, ref) => {
  const valueText = useContext(ProgressBarContext)?.valueText;

  return (
    <span {...props} ref={ref} data-tds="progress-bar-output">
      {children ?? valueText}
    </span>
  );
});

ProgressBarOutput.displayName = "ProgressBar.Output";

export type ProgressBarTrackProps = ComponentPropsWithoutRef<"div">;

export const ProgressBarTrack = forwardRef<
  HTMLDivElement,
  ProgressBarTrackProps
>((props, ref) => {
  return <div {...props} ref={ref} data-tds="progress-bar-track" />;
});

ProgressBarTrack.displayName = "ProgressBar.Track";

export type ProgressBarFillProps = ComponentPropsWithoutRef<"div">;

// As wide as the value; while indeterminate a part of the track that slides
// along it
export const ProgressBarFill = forwardRef<HTMLDivElement, ProgressBarFillProps>(
  ({ style, ...props }, ref) => {
    const state = useContext(ProgressBarContext);
    const isIndeterminate = state?.isIndeterminate ?? false;

    return (
      <div
        {...props}
        ref={ref}
        data-tds="progress-bar-fill"
        style={
          isIndeterminate
            ? style
            : { inlineSize: `${String(state?.percentage ?? 0)}%`, ...style }
        }
      />
    );
  }
);

ProgressBarFill.displayName = "ProgressBar.Fill";
