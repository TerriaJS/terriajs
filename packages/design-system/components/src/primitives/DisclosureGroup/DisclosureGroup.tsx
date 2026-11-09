import { forwardRef } from "react";
import {
  DisclosureGroup as AriaDisclosureGroup,
  type DisclosureGroupProps as AriaDisclosureGroupProps
} from "react-aria-components/DisclosureGroup";

type DisclosureGroupProps = AriaDisclosureGroupProps;

// Disclosures as sections of one list: one open at a time unless
// allowsMultipleExpanded. Each Disclosure needs an id for expandedKeys. Lines
// between them are Separators, and spacing comes from the layout classes
const DisclosureGroup = forwardRef<HTMLDivElement, DisclosureGroupProps>(
  (props, ref) => {
    return (
      <AriaDisclosureGroup {...props} ref={ref} data-tds="disclosure-group" />
    );
  }
);

DisclosureGroup.displayName = "DisclosureGroup";

export { DisclosureGroup };
export type { DisclosureGroupProps };
