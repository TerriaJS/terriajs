import {
  DatePickerPopover,
  DatePickerRoot,
  DatePickerTrigger,
  DatePickerTriggerIndicator
} from "./DatePicker";

// Compound component, assembled here so DatePicker.tsx only exports
// components
export const DatePicker = Object.assign(DatePickerRoot, {
  Root: DatePickerRoot,
  Trigger: DatePickerTrigger,
  TriggerIndicator: DatePickerTriggerIndicator,
  Popover: DatePickerPopover
});

export {
  DatePickerPopover,
  DatePickerRoot,
  DatePickerTrigger,
  DatePickerTriggerIndicator
};
export type {
  DatePickerPopoverProps,
  DatePickerRootProps,
  DatePickerRootProps as DatePickerProps,
  DatePickerTriggerIndicatorProps,
  DatePickerTriggerProps
} from "./DatePicker";
