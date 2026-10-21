import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  type DialogProps as AriaDialogProps,
  type DialogTriggerProps as AriaDialogTriggerProps
} from "react-aria-components/Dialog";
import {
  Heading as AriaHeading,
  type HeadingProps as AriaHeadingProps
} from "react-aria-components/Heading";
import {
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type ModalOverlayProps as AriaModalOverlayProps
} from "react-aria-components/Modal";
import { ButtonGroupContext } from "../ButtonGroup/ButtonGroupContext";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
// The layout is shared with Modal and lives in its stylesheet
import "../Modal/Modal.css";
import "./AlertDialog.css";

export type AlertDialogProps = AriaDialogTriggerProps;

export const AlertDialogRoot = (
  props: AlertDialogProps
): React.ReactElement => {
  return <AriaDialogTrigger {...props} />;
};

AlertDialogRoot.displayName = "AlertDialog";

export type AlertDialogBackdropVariant = "opaque" | "blur" | "transparent";

export type AlertDialogBackdropProps = AriaModalOverlayProps & {
  variant?: AlertDialogBackdropVariant;
};

// Pressing outside doesn't close it, so it isn't dismissed by accident.
// Escape still cancels.
export const AlertDialogBackdrop = ({
  isDismissable = false,
  variant = "opaque",
  ...props
}: AlertDialogBackdropProps): React.ReactElement => {
  return (
    <AriaModalOverlay
      {...props}
      isDismissable={isDismissable}
      data-tds="alert-dialog-backdrop"
      data-tds-variant={variant}
    />
  );
};

AlertDialogBackdrop.displayName = "AlertDialog.Backdrop";

export type AlertDialogSize = "xs" | "sm" | "md" | "lg";
// auto: a bottom sheet on phones, centred on wider screens
export type AlertDialogPlacement = "auto" | "center" | "top" | "bottom";
export type AlertDialogScroll = "inside" | "outside";

export type AlertDialogContainerProps = Omit<
  AriaModalOverlayProps,
  "isDismissable" | "isKeyboardDismissDisabled"
> & {
  size?: AlertDialogSize;
  placement?: AlertDialogPlacement;
  scroll?: AlertDialogScroll;
};

export const AlertDialogContainer = ({
  size = "sm",
  placement = "center",
  scroll = "inside",
  ...props
}: AlertDialogContainerProps): React.ReactElement => {
  return (
    <ButtonGroupContext.Provider value={null}>
      <AriaModal
        {...props}
        data-tds="alert-dialog-container"
        data-tds-size={size}
        data-tds-placement={placement}
        data-tds-scroll={scroll}
      />
    </ButtonGroupContext.Provider>
  );
};

AlertDialogContainer.displayName = "AlertDialog.Container";

export type AlertDialogDialogProps = Omit<AriaDialogProps, "role">;

export const AlertDialogDialog = (
  props: AlertDialogDialogProps
): React.ReactElement => {
  return (
    <AriaDialog {...props} role="alertdialog" data-tds="alert-dialog-dialog" />
  );
};

AlertDialogDialog.displayName = "AlertDialog.Dialog";

export type AlertDialogCloseTriggerProps = CloseButtonProps;

// slot="close" lets the dialog close itself when this is pressed
export const AlertDialogCloseTrigger = (
  props: AlertDialogCloseTriggerProps
): React.ReactElement => {
  return <CloseButton slot="close" {...props} />;
};

AlertDialogCloseTrigger.displayName = "AlertDialog.CloseTrigger";

export type AlertDialogHeaderAlign = "start" | "center";

export type AlertDialogHeaderProps = ComponentPropsWithoutRef<"header"> & {
  align?: AlertDialogHeaderAlign;
};

export const AlertDialogHeader = ({
  align = "start",
  ...props
}: AlertDialogHeaderProps): React.ReactElement => {
  return (
    <header {...props} data-tds="alert-dialog-header" data-tds-align={align} />
  );
};

AlertDialogHeader.displayName = "AlertDialog.Header";

export type AlertDialogIconProps = ComponentPropsWithoutRef<"span">;

export const AlertDialogIcon = (
  props: AlertDialogIconProps
): React.ReactElement => {
  return <span aria-hidden {...props} data-tds="alert-dialog-icon" />;
};

AlertDialogIcon.displayName = "AlertDialog.Icon";

export type AlertDialogHeadingProps = AriaHeadingProps & {
  children: ReactNode;
};

export const AlertDialogHeading = (
  props: AlertDialogHeadingProps
): React.ReactElement => {
  return (
    <AriaHeading slot="title" {...props} data-tds="alert-dialog-heading" />
  );
};

AlertDialogHeading.displayName = "AlertDialog.Heading";

export type AlertDialogBodyProps = ComponentPropsWithoutRef<"div">;

export const AlertDialogBody = (
  props: AlertDialogBodyProps
): React.ReactElement => {
  return <div {...props} data-tds="alert-dialog-body" />;
};

AlertDialogBody.displayName = "AlertDialog.Body";

export type AlertDialogFooterProps = ComponentPropsWithoutRef<"footer">;

export const AlertDialogFooter = (
  props: AlertDialogFooterProps
): React.ReactElement => {
  return <footer {...props} data-tds="alert-dialog-footer" />;
};

AlertDialogFooter.displayName = "AlertDialog.Footer";
