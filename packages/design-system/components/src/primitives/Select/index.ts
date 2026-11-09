import {
  SelectClearButton,
  SelectIndicator,
  SelectPopover,
  SelectRoot,
  SelectTrigger,
  SelectValue
} from "./Select";

// Compound component, assembled here so Select.tsx only exports components
export const Select = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Indicator: SelectIndicator,
  ClearButton: SelectClearButton,
  Popover: SelectPopover
});

export {
  SelectClearButton,
  SelectIndicator,
  SelectPopover,
  SelectRoot,
  SelectTrigger,
  SelectValue
};
export type {
  SelectClearButtonProps,
  SelectIndicatorProps,
  SelectPopoverProps,
  SelectProps,
  SelectTriggerProps,
  SelectValueProps
} from "./Select";
