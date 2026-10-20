import {
  ListBoxItem,
  ListBoxItemIndicator,
  ListBoxRoot,
  ListBoxSection
} from "./ListBox";

// Compound component, assembled here so ListBox.tsx only exports components
export const ListBox = Object.assign(ListBoxRoot, {
  Root: ListBoxRoot,
  Item: ListBoxItem,
  ItemIndicator: ListBoxItemIndicator,
  Section: ListBoxSection
});

export { ListBoxItem, ListBoxItemIndicator, ListBoxRoot, ListBoxSection };
export type {
  ListBoxItemIndicatorProps,
  ListBoxItemProps,
  ListBoxItemVariant,
  ListBoxProps,
  ListBoxSectionProps
} from "./ListBox";
