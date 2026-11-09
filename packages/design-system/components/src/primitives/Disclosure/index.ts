import {
  DisclosureBody,
  DisclosureContent,
  DisclosureHeading,
  DisclosureIndicator,
  DisclosureRoot,
  DisclosureTrigger
} from "./Disclosure";

// Compound component, assembled here so Disclosure.tsx only exports components
export const Disclosure = Object.assign(DisclosureRoot, {
  Root: DisclosureRoot,
  Heading: DisclosureHeading,
  Trigger: DisclosureTrigger,
  Indicator: DisclosureIndicator,
  Content: DisclosureContent,
  Body: DisclosureBody
});

export {
  DisclosureBody,
  DisclosureContent,
  DisclosureHeading,
  DisclosureIndicator,
  DisclosureRoot,
  DisclosureTrigger
};
export type {
  DisclosureBodyProps,
  DisclosureContentProps,
  DisclosureHeadingProps,
  DisclosureIndicatorProps,
  DisclosureProps,
  DisclosureTriggerProps
} from "./Disclosure";
