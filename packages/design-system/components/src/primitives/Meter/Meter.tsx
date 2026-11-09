import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef
} from "react";
import {
  Meter as AriaMeter,
  type MeterProps as AriaMeterProps,
  type MeterRenderProps
} from "react-aria-components/Meter";
import "./Meter.css";

type MeterColor = "accent" | "default" | "success" | "warning" | "danger";
type MeterSize = "sm" | "md" | "lg";

type MeterProps = {
  color?: MeterColor;
  size?: MeterSize;
} & AriaMeterProps;

const MeterContext = createContext<MeterRenderProps | null>(null);

// A Label names it; its parts read the value from here
const MeterRoot = ({
  color = "accent",
  size = "md",
  children,
  ...props
}: MeterProps): React.ReactElement => {
  return (
    <AriaMeter
      {...props}
      data-tds="meter"
      data-tds-color={color}
      data-tds-size={size}
    >
      {(values) => (
        <MeterContext.Provider value={values}>
          {typeof children === "function" ? children(values) : children}
        </MeterContext.Provider>
      )}
    </AriaMeter>
  );
};

MeterRoot.displayName = "Meter";

type MeterOutputProps = ComponentPropsWithoutRef<"span">;

// The value as text, like 60%, or the valueLabel given in its place
const MeterOutput = forwardRef<HTMLSpanElement, MeterOutputProps>(
  ({ children, ...props }, ref) => {
    const valueText = useContext(MeterContext)?.valueText;

    return (
      <span {...props} ref={ref} data-tds="meter-output">
        {children ?? valueText}
      </span>
    );
  }
);

MeterOutput.displayName = "Meter.Output";

type MeterTrackProps = ComponentPropsWithoutRef<"div">;

const MeterTrack = forwardRef<HTMLDivElement, MeterTrackProps>((props, ref) => {
  return <div {...props} ref={ref} data-tds="meter-track" />;
});

MeterTrack.displayName = "Meter.Track";

type MeterFillProps = ComponentPropsWithoutRef<"div">;

// As wide as the value
const MeterFill = forwardRef<HTMLDivElement, MeterFillProps>(
  ({ style, ...props }, ref) => {
    const percentage = useContext(MeterContext)?.percentage ?? 0;

    return (
      <div
        {...props}
        ref={ref}
        data-tds="meter-fill"
        style={{ inlineSize: `${String(percentage)}%`, ...style }}
      />
    );
  }
);

MeterFill.displayName = "Meter.Fill";

export { MeterRoot, MeterOutput, MeterTrack, MeterFill };
export type {
  MeterColor,
  MeterSize,
  MeterProps,
  MeterOutputProps,
  MeterTrackProps,
  MeterFillProps
};
