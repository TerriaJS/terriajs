import { ChevronDownIcon } from "@terria/design-system-icons";
import { forwardRef, useContext, type ComponentPropsWithoutRef } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import {
  Disclosure as AriaDisclosure,
  DisclosurePanel as AriaDisclosurePanel,
  DisclosureStateContext,
  type DisclosurePanelProps as AriaDisclosurePanelProps,
  type DisclosureProps as AriaDisclosureProps
} from "react-aria-components/Disclosure";
import {
  Heading as AriaHeading,
  type HeadingProps as AriaHeadingProps
} from "react-aria-components/Heading";
import { dataAttr } from "../../utils/dataAttr";
import "./Disclosure.css";

type DisclosureProps = AriaDisclosureProps & {
  /** The trigger spans the width and the content attaches to it */
  fullWidth?: boolean;
};

const DisclosureRoot = forwardRef<HTMLDivElement, DisclosureProps>(
  ({ fullWidth, ...props }, ref) => {
    return (
      <AriaDisclosure
        {...props}
        ref={ref}
        data-tds="disclosure"
        data-tds-full-width={dataAttr(fullWidth)}
      />
    );
  }
);

DisclosureRoot.displayName = "Disclosure";

type DisclosureHeadingProps = AriaHeadingProps;

// The trigger sits in a heading, level 3 unless set, so screen readers list
// it with the page's headings and announce it as a collapsed or expanded
// button
const DisclosureHeading = forwardRef<
  HTMLHeadingElement,
  DisclosureHeadingProps
>((props, ref) => {
  return <AriaHeading {...props} ref={ref} data-tds="disclosure-heading" />;
});

DisclosureHeading.displayName = "Disclosure.Heading";

type DisclosureTriggerProps = Omit<AriaButtonProps, "slot">;

// A plain button that toggles the content. For another look, put a Button
// with slot="trigger" in the heading instead
const DisclosureTrigger = forwardRef<HTMLButtonElement, DisclosureTriggerProps>(
  (props, ref) => {
    return (
      <AriaButton
        {...props}
        ref={ref}
        slot="trigger"
        data-tds="disclosure-trigger"
      />
    );
  }
);

DisclosureTrigger.displayName = "Disclosure.Trigger";

type DisclosureIndicatorProps = ComponentPropsWithoutRef<"span"> & {
  /** Stays still while expanded, for an icon that doesn't point */
  isStatic?: boolean;
};

// Decorative: a chevron that turns while expanded, unless children replace
// it; isStatic keeps it still
const DisclosureIndicator = forwardRef<
  HTMLSpanElement,
  DisclosureIndicatorProps
>(({ children, isStatic, ...props }, ref) => {
  const isExpanded = useContext(DisclosureStateContext)?.isExpanded ?? false;

  return (
    <span
      {...props}
      ref={ref}
      aria-hidden
      data-tds="disclosure-indicator"
      data-expanded={dataAttr(isExpanded)}
      data-tds-static={dataAttr(isStatic)}
    >
      {children ?? <ChevronDownIcon size={16} />}
    </span>
  );
});

DisclosureIndicator.displayName = "Disclosure.Indicator";

type DisclosureContentProps = AriaDisclosurePanelProps;

// The collapsible part, named by the trigger. It has no padding of its own,
// so collapsed it takes no space; the Body inside it does
const DisclosureContent = forwardRef<HTMLDivElement, DisclosureContentProps>(
  (props, ref) => {
    return (
      <AriaDisclosurePanel {...props} ref={ref} data-tds="disclosure-content" />
    );
  }
);

DisclosureContent.displayName = "Disclosure.Content";

type DisclosureBodyProps = ComponentPropsWithoutRef<"div">;

const DisclosureBody = forwardRef<HTMLDivElement, DisclosureBodyProps>(
  (props, ref) => {
    return <div {...props} ref={ref} data-tds="disclosure-body" />;
  }
);

DisclosureBody.displayName = "Disclosure.Body";

export {
  DisclosureRoot,
  DisclosureHeading,
  DisclosureTrigger,
  DisclosureIndicator,
  DisclosureContent,
  DisclosureBody
};
export type {
  DisclosureProps,
  DisclosureHeadingProps,
  DisclosureTriggerProps,
  DisclosureIndicatorProps,
  DisclosureContentProps,
  DisclosureBodyProps
};
