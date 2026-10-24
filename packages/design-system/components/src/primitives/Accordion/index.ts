import {
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger
} from "./Accordion";

// Compound component, assembled here so Accordion.tsx only exports components
export const Accordion = Object.assign(AccordionRoot, {
  Root: AccordionRoot,
  Item: AccordionItem,
  Heading: AccordionHeading,
  Trigger: AccordionTrigger,
  Indicator: AccordionIndicator,
  Panel: AccordionPanel,
  Body: AccordionBody
});

export {
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger
};
export type {
  AccordionBodyProps,
  AccordionHeadingProps,
  AccordionIndicatorProps,
  AccordionItemProps,
  AccordionPanelProps,
  AccordionProps,
  AccordionTriggerProps,
  AccordionVariant
} from "./Accordion";
