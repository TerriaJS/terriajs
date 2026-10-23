import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import {
  Dialog,
  DialogTrigger,
  type DialogProps,
  type DialogTriggerProps
} from "react-aria-components/Dialog";
import { Heading, type HeadingProps } from "react-aria-components/Heading";
import {
  OverlayArrow,
  Popover as AriaPopover,
  type OverlayArrowProps,
  type PopoverProps as AriaPopoverProps
} from "react-aria-components/Popover";
import { Pressable } from "react-aria-components/Pressable";
import { ButtonGroupContext } from "../ButtonGroup/ButtonGroupContext";
import "./Popover.css";

type PopoverProps = DialogTriggerProps;

const PopoverRoot = (props: PopoverProps): React.ReactElement => {
  return <DialogTrigger {...props} />;
};

PopoverRoot.displayName = "Popover";

type PopoverContentProps = AriaPopoverProps;

const PopoverContent = (props: PopoverContentProps): React.ReactElement => {
  return (
    <ButtonGroupContext.Provider value={null}>
      <AriaPopover {...props} data-tds="popover" />
    </ButtonGroupContext.Provider>
  );
};

PopoverContent.displayName = "Popover.Content";

type PopoverDialogProps = DialogProps;

const PopoverDialog = (props: PopoverDialogProps): React.ReactElement => {
  return <Dialog {...props} data-tds="popover-dialog" />;
};

PopoverDialog.displayName = "Popover.Dialog";

type PopoverArrowProps = OverlayArrowProps;

const PopoverArrow = ({
  children,
  ...props
}: PopoverArrowProps): React.ReactElement => {
  return (
    <OverlayArrow {...props} data-tds="popover-arrow">
      {children ?? (
        <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
          <path d="M0 0C5.48483 8 6.5 8 12 0Z" />
        </svg>
      )}
    </OverlayArrow>
  );
};

PopoverArrow.displayName = "Popover.Arrow";

type PopoverHeadingProps = HeadingProps & { children: ReactNode };

const PopoverHeading = (props: PopoverHeadingProps): React.ReactElement => {
  return <Heading slot="title" {...props} data-tds="popover-heading" />;
};

PopoverHeading.displayName = "Popover.Heading";

type PopoverTriggerProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
};

// Lets content that isn't a button open the popover, like an icon or a chip
const PopoverTrigger = forwardRef<HTMLDivElement, PopoverTriggerProps>(
  (props, ref) => {
    // Marked disabled, it looks it (Popover.css), so it doesn't open either
    const isDisabled =
      props["aria-disabled"] === true || props["aria-disabled"] === "true";
    return (
      <Pressable isDisabled={isDisabled}>
        <div role="button" {...props} ref={ref} data-tds="popover-trigger" />
      </Pressable>
    );
  }
);

PopoverTrigger.displayName = "Popover.Trigger";

export {
  PopoverRoot,
  PopoverContent,
  PopoverDialog,
  PopoverArrow,
  PopoverHeading,
  PopoverTrigger
};
export type {
  PopoverProps,
  PopoverContentProps,
  PopoverDialogProps,
  PopoverArrowProps,
  PopoverHeadingProps,
  PopoverTriggerProps
};
