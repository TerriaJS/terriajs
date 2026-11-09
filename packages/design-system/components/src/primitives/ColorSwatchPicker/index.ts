import {
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerRoot,
  ColorSwatchPickerSwatch
} from "./ColorSwatchPicker";

// Compound component, assembled here so ColorSwatchPicker.tsx only exports
// components
export const ColorSwatchPicker = Object.assign(ColorSwatchPickerRoot, {
  Root: ColorSwatchPickerRoot,
  Item: ColorSwatchPickerItem,
  Swatch: ColorSwatchPickerSwatch,
  Indicator: ColorSwatchPickerIndicator
});

export {
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerRoot,
  ColorSwatchPickerSwatch
};
export type {
  ColorSwatchPickerIndicatorProps,
  ColorSwatchPickerItemProps,
  ColorSwatchPickerProps,
  ColorSwatchPickerSwatchProps
} from "./ColorSwatchPicker";
