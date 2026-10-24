import {
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import { ChevronDownIcon } from "@terria/design-system-icons";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import {
  Disclosure as AriaDisclosure,
  DisclosurePanel as AriaDisclosurePanel,
  DisclosureStateContext,
  Heading as AriaHeading,
  type DisclosurePanelProps as AriaDisclosurePanelProps,
  type DisclosureProps as AriaDisclosureProps,
  type HeadingProps as AriaHeadingProps
} from "react-aria-components/Disclosure";
import {
  DisclosureGroup as AriaDisclosureGroup,
  type DisclosureGroupProps as AriaDisclosureGroupProps
} from "react-aria-components/DisclosureGroup";
import "./Accordion.css";

type AccordionVariant = "default" | "secondary";

type AccordionProps = AriaDisclosureGroupProps & {
  /** Secondary sits on a surface */
  variant?: AccordionVariant;
  /** Leaves out the lines between items */
  hideSeparator?: boolean;
};

// A list of items that each show and hide their content, one open at a time
// unless allowsMultipleExpanded, divided by lines. Each item needs an id for
// expandedKeys
const AccordionRoot = forwardRef<HTMLDivElement, AccordionProps>(
  ({ variant = "default", hideSeparator, ...props }, ref) => {
    return (
      <AriaDisclosureGroup
        {...props}
        ref={ref}
        data-tds="accordion"
        data-tds-variant={variant}
        data-tds-hide-separator={hideSeparator ? true : undefined}
      />
    );
  }
);

AccordionRoot.displayName = "Accordion";

type AccordionItemProps = AriaDisclosureProps;

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  (props, ref) => {
    return <AriaDisclosure {...props} ref={ref} data-tds="accordion-item" />;
  }
);

AccordionItem.displayName = "Accordion.Item";

type AccordionHeadingProps = AriaHeadingProps;

// The trigger sits in a heading, level 3 unless set
const AccordionHeading = forwardRef<HTMLHeadingElement, AccordionHeadingProps>(
  (props, ref) => {
    return <AriaHeading {...props} ref={ref} data-tds="accordion-heading" />;
  }
);

AccordionHeading.displayName = "Accordion.Heading";

type AccordionTriggerProps = Omit<AriaButtonProps, "slot">;

// The item's row: an icon, the title and the indicator, which sits at the end
const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  (props, ref) => {
    return (
      <AriaButton
        {...props}
        ref={ref}
        slot="trigger"
        data-tds="accordion-trigger"
      />
    );
  }
);

AccordionTrigger.displayName = "Accordion.Trigger";

type AccordionIndicatorProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "children"
> & {
  /** Stays still while expanded, for an icon that doesn't point */
  isStatic?: boolean;
  /** Replaces the chevron; a function draws it for the item's state */
  children?: ReactNode | ((state: { isExpanded: boolean }) => ReactNode);
};

// Decorative: a chevron that turns while expanded, unless children replace
// it, as a function of the state to swap icons; isStatic keeps it still
const AccordionIndicator = forwardRef<HTMLSpanElement, AccordionIndicatorProps>(
  ({ children, isStatic, ...props }, ref) => {
    const isExpanded = useContext(DisclosureStateContext)?.isExpanded ?? false;

    return (
      <span
        {...props}
        ref={ref}
        aria-hidden
        data-tds="accordion-indicator"
        data-expanded={isExpanded || undefined}
        data-tds-static={isStatic ? true : undefined}
      >
        {typeof children === "function"
          ? children({ isExpanded })
          : (children ?? <ChevronDownIcon size={16} />)}
      </span>
    );
  }
);

AccordionIndicator.displayName = "Accordion.Indicator";

type AccordionPanelProps = AriaDisclosurePanelProps;

// The collapsible part, named by the trigger
const AccordionPanel = forwardRef<HTMLDivElement, AccordionPanelProps>(
  (props, ref) => {
    return (
      <AriaDisclosurePanel {...props} ref={ref} data-tds="accordion-panel" />
    );
  }
);

AccordionPanel.displayName = "Accordion.Panel";

type AccordionBodyProps = ComponentPropsWithoutRef<"div">;

const AccordionBody = forwardRef<HTMLDivElement, AccordionBodyProps>(
  (props, ref) => {
    return <div {...props} ref={ref} data-tds="accordion-body" />;
  }
);

AccordionBody.displayName = "Accordion.Body";

export {
  AccordionRoot,
  AccordionItem,
  AccordionHeading,
  AccordionTrigger,
  AccordionIndicator,
  AccordionPanel,
  AccordionBody
};
export type {
  AccordionVariant,
  AccordionProps,
  AccordionItemProps,
  AccordionHeadingProps,
  AccordionTriggerProps,
  AccordionIndicatorProps,
  AccordionPanelProps,
  AccordionBodyProps
};
