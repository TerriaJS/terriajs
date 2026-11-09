import {
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogCloseTrigger,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogIcon,
  AlertDialogRoot
} from "./AlertDialog";

// Compound component, assembled here so AlertDialog.tsx only exports components
export const AlertDialog = Object.assign(AlertDialogRoot, {
  Root: AlertDialogRoot,
  Backdrop: AlertDialogBackdrop,
  Container: AlertDialogContainer,
  Dialog: AlertDialogDialog,
  CloseTrigger: AlertDialogCloseTrigger,
  Header: AlertDialogHeader,
  Icon: AlertDialogIcon,
  Heading: AlertDialogHeading,
  Body: AlertDialogBody,
  Footer: AlertDialogFooter
});

export {
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogCloseTrigger,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogIcon,
  AlertDialogRoot
};
export type {
  AlertDialogBackdropProps,
  AlertDialogBackdropVariant,
  AlertDialogBodyProps,
  AlertDialogCloseTriggerProps,
  AlertDialogContainerProps,
  AlertDialogDialogProps,
  AlertDialogFooterProps,
  AlertDialogHeaderAlign,
  AlertDialogHeaderProps,
  AlertDialogHeadingProps,
  AlertDialogIconProps,
  AlertDialogPlacement,
  AlertDialogProps,
  AlertDialogScroll,
  AlertDialogSize
} from "./AlertDialog";
