import {
  createContext,
  forwardRef,
  useContext,
  type CSSProperties,
  type ReactNode
} from "react";
import {
  ColorSlider as AriaColorSlider,
  ColorSliderStateContext,
  ColorThumb as AriaColorThumb,
  SliderOutput as AriaSliderOutput,
  SliderTrack as AriaSliderTrack,
  type ColorChannel,
  type ColorSliderProps as AriaColorSliderProps,
  type ColorSpace,
  type ColorThumbProps as AriaColorThumbProps,
  type SliderOutputProps as AriaSliderOutputProps,
  type SliderTrackProps as AriaSliderTrackProps
} from "react-aria-components/ColorSlider";
import { Label } from "../Field";
import "./ColorSlider.css";

// The space a channel only exists in, so channel="red" needs no colorSpace
const CHANNEL_SPACE: Partial<Record<ColorChannel, ColorSpace>> = {
  red: "rgb",
  green: "rgb",
  blue: "rgb",
  lightness: "hsl",
  brightness: "hsb"
};

// The slider's channel, for its track's ends
const ChannelContext = createContext<ColorChannel>("hue");

type ColorSliderRootProps = AriaColorSliderProps;

// Lays out a Label, ColorSlider.Output and ColorSlider.Track: a slider for
// one channel of a colour. colorSpace is the channel's own unless set
const ColorSliderRoot = forwardRef<HTMLDivElement, ColorSliderRootProps>(
  ({ channel, colorSpace, orientation = "horizontal", ...props }, ref) => {
    return (
      <ChannelContext.Provider value={channel}>
        <AriaColorSlider
          {...props}
          ref={ref}
          channel={channel}
          colorSpace={colorSpace ?? CHANNEL_SPACE[channel]}
          orientation={orientation}
          data-tds="color-slider"
        />
      </ChannelContext.Provider>
    );
  }
);

ColorSliderRoot.displayName = "ColorSlider";

type ColorSliderOutputProps = AriaSliderOutputProps;

// The channel's value, formatted, such as 200° or 50%
const ColorSliderOutput = forwardRef<HTMLOutputElement, ColorSliderOutputProps>(
  (props, ref) => {
    return (
      <AriaSliderOutput {...props} ref={ref} data-tds="color-slider-output" />
    );
  }
);

ColorSliderOutput.displayName = "ColorSlider.Output";

type ColorSliderTrackProps = Omit<AriaSliderTrackProps, "style">;

// The channel's range as a gradient, over a checkerboard that shows through
// a transparent colour. React Aria maps pointer movement onto exactly its
// width, so the rounded ends the thumb sits in at the extremes are drawn
// outside it, in the colour at each end
const ColorSliderTrack = forwardRef<HTMLDivElement, ColorSliderTrackProps>(
  (props, ref) => {
    const channel = useContext(ChannelContext);
    const state = useContext(ColorSliderStateContext);
    const color = state?.getDisplayColor();
    const range = color?.getChannelRange(channel);

    return (
      <AriaSliderTrack
        {...props}
        ref={ref}
        data-tds="color-slider-track"
        // Custom properties aren't among CSSProperties' keys
        style={({ defaultStyle }) =>
          ({
            ...defaultStyle,
            background: undefined,
            "--_color-slider-gradient": defaultStyle.background,
            "--_color-slider-start-color":
              color && range
                ? color
                    .withChannelValue(channel, range.minValue)
                    .toString("css")
                : "transparent",
            "--_color-slider-end-color":
              color && range
                ? color
                    .withChannelValue(channel, range.maxValue)
                    .toString("css")
                : "transparent"
          }) as CSSProperties
        }
      />
    );
  }
);

ColorSliderTrack.displayName = "ColorSlider.Track";

type ColorSliderThumbProps = AriaColorThumbProps;

// The colour picked, at its place on the track
const ColorSliderThumb = forwardRef<HTMLDivElement, ColorSliderThumbProps>(
  (props, ref) => {
    return (
      <AriaColorThumb {...props} ref={ref} data-tds="color-slider-thumb" />
    );
  }
);

ColorSliderThumb.displayName = "ColorSlider.Thumb";

type ColorSliderProps = Omit<ColorSliderRootProps, "children"> & {
  label?: ReactNode;
  /** Shows the value opposite the label */
  showValue?: boolean;
};

// The everyday colour slider: a label, its value, and the track with a
// thumb. Upright, it's the track alone
const ColorSlider = ({
  label,
  showValue = true,
  ...props
}: ColorSliderProps): React.ReactElement => {
  const upright = props.orientation === "vertical";

  return (
    <ColorSliderRoot {...props}>
      {!upright && label != null && <Label>{label}</Label>}
      {!upright && showValue && <ColorSliderOutput />}
      <ColorSliderTrack>
        <ColorSliderThumb />
      </ColorSliderTrack>
    </ColorSliderRoot>
  );
};

export {
  ColorSlider,
  ColorSliderRoot,
  ColorSliderOutput,
  ColorSliderTrack,
  ColorSliderThumb
};
export type {
  ColorSliderProps,
  ColorSliderRootProps,
  ColorSliderOutputProps,
  ColorSliderTrackProps,
  ColorSliderThumbProps
};
