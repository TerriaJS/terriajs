import {
  PopoverArrow,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
  PopoverRoot,
  PopoverTrigger
} from "./Popover";

// Compound component, assembled here so Popover.tsx only exports components
export const Popover = Object.assign(PopoverRoot, {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Dialog: PopoverDialog,
  Arrow: PopoverArrow,
  Heading: PopoverHeading
});

export {
  PopoverArrow,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
  PopoverRoot,
  PopoverTrigger
};
export type {
  PopoverArrowProps,
  PopoverContentProps,
  PopoverDialogProps,
  PopoverHeadingProps,
  PopoverProps,
  PopoverTriggerProps
} from "./Popover";
