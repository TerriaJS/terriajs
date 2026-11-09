import { ListBoxItemIndicator } from "../ListBox";
import { PopoverTrigger } from "../Popover";
import {
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownRoot,
  DropdownSection,
  DropdownSubmenuIndicator,
  DropdownSubmenuTrigger
} from "./Dropdown";

// Compound component, assembled here so Dropdown.tsx only exports components.
// Content that isn't a button opens it through the popover's trigger, and
// items mark their selection with the list box's indicator
export const Dropdown = Object.assign(DropdownRoot, {
  Root: DropdownRoot,
  Trigger: PopoverTrigger,
  Popover: DropdownPopover,
  Menu: DropdownMenu,
  Item: DropdownItem,
  ItemIndicator: ListBoxItemIndicator,
  Section: DropdownSection,
  SubmenuTrigger: DropdownSubmenuTrigger,
  SubmenuIndicator: DropdownSubmenuIndicator
});

export {
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownRoot,
  DropdownSection,
  DropdownSubmenuIndicator,
  DropdownSubmenuTrigger
};
export type {
  DropdownItemProps,
  DropdownMenuProps,
  DropdownPopoverProps,
  DropdownProps,
  DropdownSectionProps,
  DropdownSubmenuIndicatorProps,
  DropdownSubmenuTriggerProps
} from "./Dropdown";
