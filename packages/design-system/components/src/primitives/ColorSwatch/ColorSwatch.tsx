import { forwardRef, type CSSProperties } from "react";
import {
  ColorSwatch as AriaColorSwatch,
  type ColorSwatchProps as AriaColorSwatchProps
} from "react-aria-components/ColorSwatch";
import "./ColorSwatch.css";

type ColorSwatchShape = "circle" | "square";
type ColorSwatchSize = "xs" | "sm" | "md" | "lg" | "xl";

type ColorSwatchProps = Omit<AriaColorSwatchProps, "style"> & {
  shape?: ColorSwatchShape;
  size?: ColorSwatchSize;
};

// Shows a colour, named for screen readers ("vibrant blue", or colorName).
// The colour goes to CSS, which draws it over a checkerboard, so a
// transparent colour can be seen
const ColorSwatchRoot = forwardRef<HTMLDivElement, ColorSwatchProps>(
  ({ shape = "circle", size = "md", ...props }, ref) => {
    return (
      <AriaColorSwatch
        {...props}
        ref={ref}
        data-tds="color-swatch"
        data-tds-shape={shape}
        data-tds-size={size}
        // A custom property isn't one of CSSProperties' keys
        style={({ color }) =>
          ({
            "--_color-swatch-color": color.toString("css")
          }) as CSSProperties
        }
      />
    );
  }
);

ColorSwatchRoot.displayName = "ColorSwatch";

export { ColorSwatchRoot };
export type { ColorSwatchProps, ColorSwatchShape, ColorSwatchSize };
