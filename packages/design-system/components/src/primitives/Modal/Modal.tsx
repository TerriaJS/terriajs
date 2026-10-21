import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaModalTrigger,
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
import "./Modal.css";

export type ModalProps = AriaDialogTriggerProps;

export const ModalRoot = (props: ModalProps): React.ReactElement => {
  return <AriaModalTrigger {...props} />;
};

ModalRoot.displayName = "Modal";

export type ModalBackdropVariant = "opaque" | "blur" | "transparent";

export type ModalBackdropProps = AriaModalOverlayProps & {
  variant?: ModalBackdropVariant;
};

// Pressing outside the dialog closes it, unless isDismissable is false
export const ModalBackdrop = ({
  isDismissable = true,
  variant = "opaque",
  ...props
}: ModalBackdropProps): React.ReactElement => {
  return (
    <AriaModalOverlay
      {...props}
      isDismissable={isDismissable}
      data-tds="modal-backdrop"
      data-tds-variant={variant}
    />
  );
};

ModalBackdrop.displayName = "Modal.Backdrop";

export type ModalSize = "xs" | "sm" | "md" | "lg" | "cover" | "full";
// auto: a bottom sheet on phones, centred on wider screens
export type ModalPlacement = "auto" | "center" | "top" | "bottom";
export type ModalScroll = "inside" | "outside";

export type ModalContainerProps = Omit<
  AriaModalOverlayProps,
  "isDismissable" | "isKeyboardDismissDisabled"
> & {
  size?: ModalSize;
  placement?: ModalPlacement;
  scroll?: ModalScroll;
};

export const ModalContainer = ({
  size = "sm",
  placement = "center",
  scroll = "inside",
  ...props
}: ModalContainerProps): React.ReactElement => {
  return (
    <ButtonGroupContext.Provider value={null}>
      <AriaModal
        {...props}
        data-tds="modal-container"
        data-tds-size={size}
        data-tds-placement={placement}
        data-tds-scroll={scroll}
      />
    </ButtonGroupContext.Provider>
  );
};

ModalContainer.displayName = "Modal.Container";

export type ModalDialogProps = AriaDialogProps;

export const ModalDialog = (props: ModalDialogProps): React.ReactElement => {
  return <AriaDialog {...props} data-tds="modal-dialog" />;
};

ModalDialog.displayName = "Modal.Dialog";

export type ModalCloseTriggerProps = CloseButtonProps;

// slot="close" lets the dialog close itself when this is pressed
export const ModalCloseTrigger = (
  props: ModalCloseTriggerProps
): React.ReactElement => {
  return <CloseButton slot="close" {...props} />;
};

ModalCloseTrigger.displayName = "Modal.CloseTrigger";

export type ModalHeaderAlign = "start" | "center";

export type ModalHeaderProps = ComponentPropsWithoutRef<"header"> & {
  align?: ModalHeaderAlign;
};

export const ModalHeader = ({
  align = "start",
  ...props
}: ModalHeaderProps): React.ReactElement => {
  return <header {...props} data-tds="modal-header" data-tds-align={align} />;
};

ModalHeader.displayName = "Modal.Header";

export type ModalIconProps = ComponentPropsWithoutRef<"span">;

export const ModalIcon = (props: ModalIconProps): React.ReactElement => {
  return <span aria-hidden {...props} data-tds="modal-icon" />;
};

ModalIcon.displayName = "Modal.Icon";

export type ModalHeadingProps = AriaHeadingProps & { children: ReactNode };

export const ModalHeading = (props: ModalHeadingProps): React.ReactElement => {
  return <AriaHeading slot="title" {...props} data-tds="modal-heading" />;
};

ModalHeading.displayName = "Modal.Heading";

export type ModalBodyProps = ComponentPropsWithoutRef<"div">;

export const ModalBody = (props: ModalBodyProps): React.ReactElement => {
  return <div {...props} data-tds="modal-body" />;
};

ModalBody.displayName = "Modal.Body";

export type ModalFooterProps = ComponentPropsWithoutRef<"footer">;

export const ModalFooter = (props: ModalFooterProps): React.ReactElement => {
  return <footer {...props} data-tds="modal-footer" />;
};

ModalFooter.displayName = "Modal.Footer";
