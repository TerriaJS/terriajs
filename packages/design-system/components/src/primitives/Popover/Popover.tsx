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
import "./Popover.css";

export type PopoverProps = DialogTriggerProps;

export const PopoverRoot = (props: PopoverProps): React.ReactElement => {
  return <DialogTrigger {...props} />;
};

PopoverRoot.displayName = "Popover";

export type PopoverContentProps = AriaPopoverProps;

export const PopoverContent = (
  props: PopoverContentProps
): React.ReactElement => {
  return <AriaPopover {...props} data-tds="popover" />;
};

PopoverContent.displayName = "Popover.Content";

export type PopoverDialogProps = DialogProps;

export const PopoverDialog = (
  props: PopoverDialogProps
): React.ReactElement => {
  return <Dialog {...props} data-tds="popover-dialog" />;
};

PopoverDialog.displayName = "Popover.Dialog";

export type PopoverArrowProps = OverlayArrowProps;

export const PopoverArrow = ({
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

export type PopoverHeadingProps = HeadingProps & { children: ReactNode };

export const PopoverHeading = (
  props: PopoverHeadingProps
): React.ReactElement => {
  return <Heading slot="title" {...props} data-tds="popover-heading" />;
};

PopoverHeading.displayName = "Popover.Heading";

export type PopoverTriggerProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
};

// Lets content that isn't a button open the popover, like an icon or a chip
export const PopoverTrigger = forwardRef<HTMLDivElement, PopoverTriggerProps>(
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
