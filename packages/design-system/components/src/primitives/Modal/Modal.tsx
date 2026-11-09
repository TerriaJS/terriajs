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

type ModalProps = AriaDialogTriggerProps;

const ModalRoot = (props: ModalProps): React.ReactElement => {
  return <AriaModalTrigger {...props} />;
};

ModalRoot.displayName = "Modal";

type ModalBackdropVariant = "opaque" | "blur" | "transparent";

type ModalBackdropProps = AriaModalOverlayProps & {
  variant?: ModalBackdropVariant;
};

// Pressing outside the dialog closes it, unless isDismissable is false
const ModalBackdrop = ({
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

type ModalSize = "xs" | "sm" | "md" | "lg" | "cover" | "full";
// auto: a bottom sheet on phones, centred on wider screens
type ModalPlacement = "auto" | "center" | "top" | "bottom";
type ModalScroll = "inside" | "outside";

type ModalContainerProps = Omit<
  AriaModalOverlayProps,
  "isDismissable" | "isKeyboardDismissDisabled"
> & {
  size?: ModalSize;
  placement?: ModalPlacement;
  scroll?: ModalScroll;
};

const ModalContainer = ({
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

type ModalDialogProps = AriaDialogProps;

const ModalDialog = (props: ModalDialogProps): React.ReactElement => {
  return <AriaDialog {...props} data-tds="modal-dialog" />;
};

ModalDialog.displayName = "Modal.Dialog";

type ModalCloseTriggerProps = CloseButtonProps;

// slot="close" lets the dialog close itself when this is pressed
const ModalCloseTrigger = (
  props: ModalCloseTriggerProps
): React.ReactElement => {
  return <CloseButton slot="close" {...props} />;
};

ModalCloseTrigger.displayName = "Modal.CloseTrigger";

type ModalHeaderAlign = "start" | "center";

type ModalHeaderProps = ComponentPropsWithoutRef<"header"> & {
  align?: ModalHeaderAlign;
};

const ModalHeader = ({
  align = "start",
  ...props
}: ModalHeaderProps): React.ReactElement => {
  return <header {...props} data-tds="modal-header" data-tds-align={align} />;
};

ModalHeader.displayName = "Modal.Header";

type ModalIconProps = ComponentPropsWithoutRef<"span">;

const ModalIcon = (props: ModalIconProps): React.ReactElement => {
  return <span aria-hidden {...props} data-tds="modal-icon" />;
};

ModalIcon.displayName = "Modal.Icon";

type ModalHeadingProps = AriaHeadingProps & { children: ReactNode };

const ModalHeading = (props: ModalHeadingProps): React.ReactElement => {
  return <AriaHeading slot="title" {...props} data-tds="modal-heading" />;
};

ModalHeading.displayName = "Modal.Heading";

type ModalBodyProps = ComponentPropsWithoutRef<"div">;

const ModalBody = (props: ModalBodyProps): React.ReactElement => {
  return <div {...props} data-tds="modal-body" />;
};

ModalBody.displayName = "Modal.Body";

type ModalFooterProps = ComponentPropsWithoutRef<"footer">;

const ModalFooter = (props: ModalFooterProps): React.ReactElement => {
  return <footer {...props} data-tds="modal-footer" />;
};

ModalFooter.displayName = "Modal.Footer";

export {
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalHeader,
  ModalIcon,
  ModalHeading,
  ModalBody,
  ModalFooter
};
export type {
  ModalProps,
  ModalBackdropVariant,
  ModalBackdropProps,
  ModalSize,
  ModalPlacement,
  ModalScroll,
  ModalContainerProps,
  ModalDialogProps,
  ModalCloseTriggerProps,
  ModalHeaderAlign,
  ModalHeaderProps,
  ModalIconProps,
  ModalHeadingProps,
  ModalBodyProps,
  ModalFooterProps
};
