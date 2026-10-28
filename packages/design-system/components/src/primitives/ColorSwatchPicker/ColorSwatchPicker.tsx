import { CheckIcon } from "@terria/design-system-icons";
import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode
} from "react";
import {
  ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem as AriaColorSwatchPickerItem,
  type Color,
  type ColorSwatchPickerItemProps as AriaColorSwatchPickerItemProps,
  type ColorSwatchPickerProps as AriaColorSwatchPickerProps
} from "react-aria-components/ColorSwatchPicker";
import {
  ColorSwatch,
  type ColorSwatchShape,
  type ColorSwatchSize
} from "../ColorSwatch";
import { dataAttr } from "../../utils/dataAttr";
import "./ColorSwatchPicker.css";

type ColorSwatchPickerProps = AriaColorSwatchPickerProps & {
  shape?: ColorSwatchShape;
  size?: ColorSwatchSize;
};

// The picker's shape and size, for its swatches
const SwatchLookContext = createContext<{
  shape: ColorSwatchShape;
  size: ColorSwatchSize;
}>({ shape: "circle", size: "md" });

// A row of colours to pick one from, as a listbox: the arrows move between
// them and Enter or a press picks one
const ColorSwatchPickerRoot = forwardRef<
  HTMLDivElement,
  ColorSwatchPickerProps
>(({ shape = "circle", size = "md", ...props }, ref) => {
  const look = useMemo(() => ({ shape, size }), [shape, size]);

  return (
    <SwatchLookContext.Provider value={look}>
      <AriaColorSwatchPicker
        {...props}
        ref={ref}
        data-tds="color-swatch-picker"
        data-tds-shape={shape}
        data-tds-size={size}
      />
    </SwatchLookContext.Provider>
  );
});

ColorSwatchPickerRoot.displayName = "ColorSwatchPicker";

// Light colours get a dark check, dark ones a light check
const isLight = (color: Color): boolean => {
  const rgb = color.toFormat("rgb");
  const luminance =
    0.2126 * rgb.getChannelValue("red") +
    0.7152 * rgb.getChannelValue("green") +
    0.0722 * rgb.getChannelValue("blue");
  return luminance / 255 > 0.5;
};

type ColorSwatchPickerItemProps = Omit<
  AriaColorSwatchPickerItemProps,
  "children" | "style"
> & {
  /** Replaces the swatch and its check */
  children?: ReactNode;
};

// One colour to pick: its swatch, and a check while it's picked, unless
// children replace them
const ColorSwatchPickerItem = forwardRef<
  HTMLDivElement,
  ColorSwatchPickerItemProps
>(({ children, ...props }, ref) => {
  return (
    <AriaColorSwatchPickerItem
      {...props}
      ref={ref}
      data-tds="color-swatch-picker-item"
      // A custom property isn't one of CSSProperties' keys
      style={({ color }) =>
        ({
          "--_color-swatch-picker-item-color": color.toString("css")
        }) as CSSProperties
      }
    >
      {({ color }) => (
        <span
          data-tds="color-swatch-picker-item-content"
          data-tds-light={dataAttr(isLight(color))}
        >
          {children ?? (
            <>
              <ColorSwatchPickerSwatch />
              <ColorSwatchPickerIndicator />
            </>
          )}
        </span>
      )}
    </AriaColorSwatchPickerItem>
  );
});

ColorSwatchPickerItem.displayName = "ColorSwatchPicker.Item";

type ColorSwatchPickerSwatchProps = Omit<
  ComponentPropsWithoutRef<typeof ColorSwatch>,
  "shape" | "size"
>;

// The item's colour, in the picker's shape
const ColorSwatchPickerSwatch = forwardRef<
  HTMLDivElement,
  ColorSwatchPickerSwatchProps
>((props, ref) => {
  const { shape, size } = useContext(SwatchLookContext);
  return <ColorSwatch {...props} ref={ref} shape={shape} size={size} />;
});

ColorSwatchPickerSwatch.displayName = "ColorSwatchPicker.Swatch";

type ColorSwatchPickerIndicatorProps = ComponentPropsWithoutRef<"span">;

// Decorative: a check, shown while the item is picked, unless children
// replace it
const ColorSwatchPickerIndicator = forwardRef<
  HTMLSpanElement,
  ColorSwatchPickerIndicatorProps
>(({ children, ...props }, ref) => {
  return (
    <span
      {...props}
      ref={ref}
      aria-hidden
      data-tds="color-swatch-picker-indicator"
    >
      {children ?? <CheckIcon />}
    </span>
  );
});

ColorSwatchPickerIndicator.displayName = "ColorSwatchPicker.Indicator";

export {
  ColorSwatchPickerRoot,
  ColorSwatchPickerItem,
  ColorSwatchPickerSwatch,
  ColorSwatchPickerIndicator
};
export type {
  ColorSwatchPickerProps,
  ColorSwatchPickerItemProps,
  ColorSwatchPickerSwatchProps,
  ColorSwatchPickerIndicatorProps
};
