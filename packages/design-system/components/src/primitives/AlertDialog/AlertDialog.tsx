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

type AlertDialogProps = AriaDialogTriggerProps;

const AlertDialogRoot = (props: AlertDialogProps): React.ReactElement => {
  return <AriaDialogTrigger {...props} />;
};

AlertDialogRoot.displayName = "AlertDialog";

type AlertDialogBackdropVariant = "opaque" | "blur" | "transparent";

type AlertDialogBackdropProps = AriaModalOverlayProps & {
  variant?: AlertDialogBackdropVariant;
};

// Pressing outside doesn't close it, so it isn't dismissed by accident.
// Escape still cancels.
const AlertDialogBackdrop = ({
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

type AlertDialogSize = "xs" | "sm" | "md" | "lg";
// auto: a bottom sheet on phones, centred on wider screens
type AlertDialogPlacement = "auto" | "center" | "top" | "bottom";
type AlertDialogScroll = "inside" | "outside";

type AlertDialogContainerProps = Omit<
  AriaModalOverlayProps,
  "isDismissable" | "isKeyboardDismissDisabled"
> & {
  size?: AlertDialogSize;
  placement?: AlertDialogPlacement;
  scroll?: AlertDialogScroll;
};

const AlertDialogContainer = ({
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

type AlertDialogDialogProps = Omit<AriaDialogProps, "role">;

const AlertDialogDialog = (
  props: AlertDialogDialogProps
): React.ReactElement => {
  return (
    <AriaDialog {...props} role="alertdialog" data-tds="alert-dialog-dialog" />
  );
};

AlertDialogDialog.displayName = "AlertDialog.Dialog";

type AlertDialogCloseTriggerProps = CloseButtonProps;

// slot="close" lets the dialog close itself when this is pressed
const AlertDialogCloseTrigger = (
  props: AlertDialogCloseTriggerProps
): React.ReactElement => {
  return <CloseButton slot="close" {...props} />;
};

AlertDialogCloseTrigger.displayName = "AlertDialog.CloseTrigger";

type AlertDialogHeaderAlign = "start" | "center";

type AlertDialogHeaderProps = ComponentPropsWithoutRef<"header"> & {
  align?: AlertDialogHeaderAlign;
};

const AlertDialogHeader = ({
  align = "start",
  ...props
}: AlertDialogHeaderProps): React.ReactElement => {
  return (
    <header {...props} data-tds="alert-dialog-header" data-tds-align={align} />
  );
};

AlertDialogHeader.displayName = "AlertDialog.Header";

type AlertDialogIconProps = ComponentPropsWithoutRef<"span">;

const AlertDialogIcon = (props: AlertDialogIconProps): React.ReactElement => {
  return <span aria-hidden {...props} data-tds="alert-dialog-icon" />;
};

AlertDialogIcon.displayName = "AlertDialog.Icon";

type AlertDialogHeadingProps = AriaHeadingProps & {
  children: ReactNode;
};

const AlertDialogHeading = (
  props: AlertDialogHeadingProps
): React.ReactElement => {
  return (
    <AriaHeading slot="title" {...props} data-tds="alert-dialog-heading" />
  );
};

AlertDialogHeading.displayName = "AlertDialog.Heading";

type AlertDialogBodyProps = ComponentPropsWithoutRef<"div">;

const AlertDialogBody = (props: AlertDialogBodyProps): React.ReactElement => {
  return <div {...props} data-tds="alert-dialog-body" />;
};

AlertDialogBody.displayName = "AlertDialog.Body";

type AlertDialogFooterProps = ComponentPropsWithoutRef<"footer">;

const AlertDialogFooter = (
  props: AlertDialogFooterProps
): React.ReactElement => {
  return <footer {...props} data-tds="alert-dialog-footer" />;
};

AlertDialogFooter.displayName = "AlertDialog.Footer";

export {
  AlertDialogRoot,
  AlertDialogBackdrop,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogCloseTrigger,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogHeading,
  AlertDialogBody,
  AlertDialogFooter
};
export type {
  AlertDialogProps,
  AlertDialogBackdropVariant,
  AlertDialogBackdropProps,
  AlertDialogSize,
  AlertDialogPlacement,
  AlertDialogScroll,
  AlertDialogContainerProps,
  AlertDialogDialogProps,
  AlertDialogCloseTriggerProps,
  AlertDialogHeaderAlign,
  AlertDialogHeaderProps,
  AlertDialogIconProps,
  AlertDialogHeadingProps,
  AlertDialogBodyProps,
  AlertDialogFooterProps
};
