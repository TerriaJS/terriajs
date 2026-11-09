import {
  ModalBackdrop,
  ModalBody,
  ModalCloseTrigger,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalIcon,
  ModalRoot
} from "./Modal";

// Compound component, assembled here so Modal.tsx only exports components
export const Modal = Object.assign(ModalRoot, {
  Root: ModalRoot,
  Backdrop: ModalBackdrop,
  Container: ModalContainer,
  Dialog: ModalDialog,
  CloseTrigger: ModalCloseTrigger,
  Header: ModalHeader,
  Icon: ModalIcon,
  Heading: ModalHeading,
  Body: ModalBody,
  Footer: ModalFooter
});

export {
  ModalBackdrop,
  ModalBody,
  ModalCloseTrigger,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalIcon,
  ModalRoot
};
export type {
  ModalBackdropProps,
  ModalBackdropVariant,
  ModalBodyProps,
  ModalCloseTriggerProps,
  ModalContainerProps,
  ModalDialogProps,
  ModalFooterProps,
  ModalHeaderAlign,
  ModalHeaderProps,
  ModalHeadingProps,
  ModalIconProps,
  ModalPlacement,
  ModalProps,
  ModalSize,
  ModalScroll
} from "./Modal";
