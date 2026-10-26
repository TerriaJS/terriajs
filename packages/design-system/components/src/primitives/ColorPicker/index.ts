import {
  ColorPickerIndicator,
  ColorPickerPopover,
  ColorPickerRoot,
  ColorPickerTrigger
} from "./ColorPicker";

// Compound component, assembled here so ColorPicker.tsx only exports
// components
export const ColorPicker = Object.assign(ColorPickerRoot, {
  Root: ColorPickerRoot,
  Trigger: ColorPickerTrigger,
  Indicator: ColorPickerIndicator,
  Popover: ColorPickerPopover
});

export {
  ColorPickerIndicator,
  ColorPickerPopover,
  ColorPickerRoot,
  ColorPickerTrigger
};
export type {
  ColorPickerIndicatorProps,
  ColorPickerPopoverProps,
  ColorPickerProps,
  ColorPickerTriggerProps
} from "./ColorPicker";
