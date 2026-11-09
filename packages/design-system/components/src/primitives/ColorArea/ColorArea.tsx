import { forwardRef, type ReactNode } from "react";
import {
  ColorArea as AriaColorArea,
  ColorThumb as AriaColorThumb,
  type ColorAreaProps as AriaColorAreaProps,
  type ColorThumbProps as AriaColorThumbProps
} from "react-aria-components/ColorArea";
import { dataAttr } from "../../utils/dataAttr";
import "./ColorArea.css";

type ColorAreaProps = Omit<AriaColorAreaProps, "children"> & {
  /** Overlays dots on the area */
  showDots?: boolean;
  /** Replaces the thumb */
  children?: ReactNode;
};

// Picks two channels of a colour at once by dragging its thumb, or from the
// keyboard: saturation across and brightness up, as beside a hue slider,
// unless colorSpace, xChannel and yChannel say otherwise. Another colour
// space has channels of its own, which React Aria picks. Screen readers hear
// one 2D slider describing both
const ColorAreaRoot = forwardRef<HTMLDivElement, ColorAreaProps>(
  (
    { showDots, children, colorSpace = "hsb", xChannel, yChannel, ...props },
    ref
  ) => {
    const isHsb = colorSpace === "hsb";

    return (
      <AriaColorArea
        {...props}
        colorSpace={colorSpace}
        xChannel={xChannel ?? (isHsb ? "saturation" : undefined)}
        yChannel={yChannel ?? (isHsb ? "brightness" : undefined)}
        ref={ref}
        data-tds="color-area"
        data-tds-dots={dataAttr(showDots)}
      >
        {children ?? <ColorAreaThumb />}
      </AriaColorArea>
    );
  }
);

ColorAreaRoot.displayName = "ColorArea";

type ColorAreaThumbProps = AriaColorThumbProps;

// The colour picked, at its place in the area
const ColorAreaThumb = forwardRef<HTMLDivElement, ColorAreaThumbProps>(
  (props, ref) => {
    return <AriaColorThumb {...props} ref={ref} data-tds="color-area-thumb" />;
  }
);

ColorAreaThumb.displayName = "ColorArea.Thumb";

export { ColorAreaRoot, ColorAreaThumb };
export type { ColorAreaProps, ColorAreaThumbProps };
