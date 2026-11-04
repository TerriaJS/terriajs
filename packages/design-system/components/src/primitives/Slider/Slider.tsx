import { useLayoutEffect } from "@react-aria/utils";
import {
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from "react";
import {
  Slider as AriaSlider,
  SliderFill as AriaSliderFill,
  SliderOutput as AriaSliderOutput,
  SliderStateContext,
  SliderThumb as AriaSliderThumb,
  SliderTrack as AriaSliderTrack,
  type SliderFillProps as AriaSliderFillProps,
  type SliderOutputProps as AriaSliderOutputProps,
  type SliderProps as AriaSliderProps,
  type SliderThumbProps as AriaSliderThumbProps,
  type SliderTrackProps as AriaSliderTrackProps
} from "react-aria-components/Slider";
import { useLocale } from "react-aria-components/I18nProvider";
import { TooltipTriggerStateContext } from "react-aria-components/Tooltip";
import { Label } from "../Field";
import { TooltipArrow, TooltipContent } from "../Tooltip";
import { dataAttr } from "../../utils/dataAttr";
import "./Slider.css";

// Lays out a Label, Slider.Output and Slider.Track
type SliderRootProps = AriaSliderProps;

// Laid out in the locale's direction: React Aria places the thumbs by it,
// so the ticks, marks and fill, which follow the element's, agree with them
// even where the page sets no dir
const SliderRoot = ({
  orientation = "horizontal",
  ...props
}: SliderRootProps): React.ReactElement => {
  const { direction } = useLocale();
  return (
    <AriaSlider
      dir={direction}
      {...props}
      orientation={orientation}
      data-tds="slider"
    />
  );
};

SliderRoot.displayName = "Slider";

type SliderOutputProps = AriaSliderOutputProps;

// The current value, or a range's two values, unless children format it
const SliderOutput = ({
  children,
  ...props
}: SliderOutputProps): React.ReactElement => {
  return (
    <AriaSliderOutput {...props} data-tds="slider-output">
      {children ??
        (({ state }) =>
          state.values
            .map((_, index) => state.getThumbValueLabel(index))
            .join(" – "))}
    </AriaSliderOutput>
  );
};

SliderOutput.displayName = "Slider.Output";

type SliderState = NonNullable<React.ContextType<typeof SliderStateContext>>;

// The values the fill spans, as React Aria's SliderFill works them out: from
// the offset (the minimum by default) to the thumb, or between a range's ends
const getFillRange = (
  state: SliderState,
  offset: number | undefined
): { start: number; end: number } => {
  const last = state.values.length - 1;
  const from =
    last > 0
      ? (state.values[0] ?? 0)
      : Math.min(
          Math.max(
            offset ?? state.getThumbMinValue(0),
            state.getThumbMinValue(0)
          ),
          state.getThumbMaxValue(0)
        );
  const to = state.values[last] ?? from;
  return { start: Math.min(from, to), end: Math.max(from, to) };
};

type SliderTrackProps = AriaSliderTrackProps;

// The bar. It's exactly the range values map onto; its rounded ends, where
// the thumbs sit at the extremes, are drawn outside it
const SliderTrack = (props: SliderTrackProps): React.ReactElement => {
  return <AriaSliderTrack {...props} data-tds="slider-track" />;
};

SliderTrack.displayName = "Slider.Track";

type SliderFillProps = AriaSliderFillProps;

// From the offset to the thumb, or between a range's two thumbs. It also
// fills the track's rounded ends when it reaches them
const SliderFill = (props: SliderFillProps): React.ReactElement => {
  const state = useContext(SliderStateContext);
  const range = state ? getFillRange(state, props.offset) : undefined;
  const start = range && state ? state.getValuePercent(range.start) : 0;
  const end = range && state ? state.getValuePercent(range.end) : 0;

  return (
    <AriaSliderFill
      {...props}
      data-tds="slider-fill"
      data-tds-fill-start={dataAttr(start === 0 && end > start)}
      data-tds-fill-end={dataAttr(end === 1 && end > start)}
    />
  );
};

SliderFill.displayName = "Slider.Fill";

// A dot at every step value, drawn lighter where the fill covers it
type SliderTicksProps = {
  /** The Fill's offset, so the ticks it covers are drawn lighter */
  fillOffset?: number;
};

const SliderTicks = ({
  fillOffset
}: SliderTicksProps): React.ReactElement | null => {
  const state = useContext(SliderStateContext);
  if (!state || state.values.length === 0) return null;

  const last = state.values.length - 1;
  const min = state.getThumbMinValue(0);
  const max = state.getThumbMaxValue(last);
  // The epsilon keeps max when floating-point steps fall just short of it
  const count = Math.floor((max - min) / state.step + 1e-9) + 1;
  const fill = getFillRange(state, fillOffset);

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const value = min + index * state.step;
        return (
          <span
            key={value}
            aria-hidden
            data-tds="slider-tick"
            data-tds-filled={
              (value >= fill.start && value <= fill.end) || undefined
            }
            style={{
              [state.orientation === "vertical"
                ? "insetBlockEnd"
                : "insetInlineStart"]:
                `${String(state.getValuePercent(value) * 100)}%`
            }}
          />
        );
      })}
    </>
  );
};

SliderTicks.displayName = "Slider.Ticks";

type SliderMark = number | { value: number; label: ReactNode };

type SliderMarksProps = {
  /** Values to label, in the slider's format unless given a label */
  marks: readonly SliderMark[];
};

// Labels under the track, each centred on its value. Hidden from assistive
// tech, which already hears the value through the thumb
const SliderMarks = ({
  marks
}: SliderMarksProps): React.ReactElement | null => {
  const state = useContext(SliderStateContext);
  if (!state) return null;

  return (
    <div aria-hidden data-tds="slider-marks">
      {marks.map((mark) => {
        const { value, label } =
          typeof mark === "number"
            ? { value: mark, label: state.getFormattedValue(mark) }
            : mark;
        const percent = state.getValuePercent(value);
        return (
          <span
            key={value}
            data-tds="slider-mark"
            data-tds-edge={
              percent === 0 ? "start" : percent === 1 ? "end" : undefined
            }
            style={{
              [state.orientation === "vertical"
                ? "insetBlockEnd"
                : "insetInlineStart"]: `${String(percent * 100)}%`
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
};

SliderMarks.displayName = "Slider.Marks";

type SliderThumbProps = AriaSliderThumbProps;

const SliderThumb = forwardRef<HTMLDivElement, SliderThumbProps>(
  (props, ref) => {
    return <AriaSliderThumb {...props} ref={ref} data-tds="slider-thumb" />;
  }
);

SliderThumb.displayName = "Slider.Thumb";

type SliderTooltipContent = (thumb: {
  index: number;
  value: number;
}) => ReactNode;

type SliderProps = Omit<SliderRootProps, "children"> & {
  label?: ReactNode;
  /** Shows the value opposite the label */
  showValue?: boolean;
  /** Marks every step on the track; best for a few large steps */
  showSteps?: boolean;
  /** Values to label under the track */
  marks?: readonly SliderMark[];
  /**
   * Shows a tooltip above a thumb while it's hovered, dragged or focused:
   * its formatted value, or what a function returns for it
   */
  showTooltip?: boolean | SliderTooltipContent;
  /**
   * A name for each thumb, in order, read with the slider's label: a range
   * needs them, so each end is told apart, as "From Year" and "To Year"
   */
  thumbLabels?: readonly string[];
};

// A thumb, with a tooltip when asked: its formatted value, or the content a
// function returns. The thumb isn't a tooltip trigger, so the tooltip anchors
// to it and opens from the thumb's own state
const Thumb = ({
  index,
  label,
  tooltip
}: {
  index: number;
  label: string | undefined;
  tooltip: true | SliderTooltipContent | undefined;
}): React.ReactElement => {
  const ref = useRef<HTMLDivElement>(null);
  // Escape hides the tooltip, as a tooltip should be dismissable, until the
  // thumb is next focused, hovered, moved or dragged
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUnderPointer, setIsUnderPointer] = useState(false);
  // Whether the tooltip showed before a key: the key itself makes the thumb's
  // focus visible, which would show it
  const shownRef = useRef(false);

  // A hovered thumb seldom has focus, so it hears Escape from the page, before
  // a focused thumb whose tooltip showed can stop it there
  useEffect(() => {
    if (!isUnderPointer || isDismissed) return;
    const dismiss = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") setIsDismissed(true);
    };
    document.addEventListener("keydown", dismiss, true);
    return () => {
      document.removeEventListener("keydown", dismiss, true);
    };
  }, [isUnderPointer, isDismissed]);

  if (tooltip === undefined) {
    return <SliderThumb index={index} aria-label={label} />;
  }

  return (
    <SliderThumb
      index={index}
      aria-label={label}
      ref={ref}
      onFocus={() => {
        setIsDismissed(false);
      }}
      onHoverStart={() => {
        setIsUnderPointer(true);
        setIsDismissed(false);
      }}
      onHoverEnd={() => {
        setIsUnderPointer(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") {
          setIsDismissed(false);
        } else {
          // Escape never shows the tooltip, so it's dismissed either way
          setIsDismissed(true);
          // Closing a tooltip that showed is all it does; otherwise it goes
          // on, to what holds the slider
          if (shownRef.current) return;
        }
        // react-aria stops keydown propagation unless a handler opts back in
        event.continuePropagation();
      }}
    >
      {({ isDragging, isHovered, isFocusVisible, state }) => (
        <ThumbTooltip
          isOpen={isDragging || ((isHovered || isFocusVisible) && !isDismissed)}
          shownRef={shownRef}
          triggerRef={ref}
          onClose={() => {
            setIsDismissed(true);
          }}
        >
          {tooltip === true
            ? state.getThumbValueLabel(index)
            : tooltip({ index, value: state.getThumbValue(index) })}
        </ThumbTooltip>
      )}
    </SliderThumb>
  );
};

// A thumb's tooltip, noting whether it last showed for the thumb's key
// handler. The thumb's state goes in through the trigger context: React Aria's
// Tooltip takes isOpen on its own, but its inner part still reads the context
// and fails without it
const ThumbTooltip = ({
  isOpen,
  shownRef,
  triggerRef,
  onClose,
  children
}: {
  isOpen: boolean;
  shownRef: { current: boolean };
  triggerRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  children: ReactNode;
}): React.ReactElement => {
  useLayoutEffect(() => {
    shownRef.current = isOpen;
  }, [isOpen, shownRef]);

  return (
    <TooltipTriggerStateContext.Provider
      value={{
        isOpen,
        open: () => undefined,
        close: onClose,
        shouldSkipAnimation: false
      }}
    >
      <TooltipContent triggerRef={triggerRef} showArrow>
        <TooltipArrow />
        {children}
      </TooltipContent>
    </TooltipTriggerStateContext.Provider>
  );
};

// The everyday slider: a label, its value, and a thumb for each value
const Slider = ({
  label,
  showValue = true,
  showSteps = false,
  marks,
  showTooltip = false,
  thumbLabels,
  ...props
}: SliderProps): React.ReactElement => {
  return (
    <SliderRoot {...props}>
      {label != null && <Label>{label}</Label>}
      {showValue && <SliderOutput />}
      <SliderTrack>
        {({ state }) => (
          <>
            <SliderFill />
            {showSteps && <SliderTicks />}
            {state.values.map((_, index) => (
              <Thumb
                // eslint-disable-next-line @eslint-react/no-array-index-key -- a thumb is its position in the values
                key={index}
                index={index}
                label={thumbLabels?.[index]}
                tooltip={showTooltip === false ? undefined : showTooltip}
              />
            ))}
          </>
        )}
      </SliderTrack>
      {marks && <SliderMarks marks={marks} />}
    </SliderRoot>
  );
};

export {
  SliderRoot,
  SliderOutput,
  SliderTrack,
  SliderFill,
  SliderTicks,
  SliderMarks,
  SliderThumb,
  Slider
};
export type {
  SliderRootProps,
  SliderOutputProps,
  SliderTrackProps,
  SliderFillProps,
  SliderTicksProps,
  SliderMark,
  SliderMarksProps,
  SliderThumbProps,
  SliderTooltipContent,
  SliderProps
};
