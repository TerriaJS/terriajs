import {
  ToastActionButton,
  ToastCloseButton,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastProvider,
  Toast as ToastRoot,
  ToastTitle
} from "./Toast";
import { ToastQueue, toast, toastQueue } from "./ToastQueue";

// Compound component, assembled here so Toast.tsx only exports components
export const Toast = Object.assign(ToastRoot, {
  Provider: ToastProvider,
  Content: ToastContent,
  Indicator: ToastIndicator,
  Title: ToastTitle,
  Description: ToastDescription,
  ActionButton: ToastActionButton,
  CloseButton: ToastCloseButton,
  Queue: ToastQueue,
  toast
});

export {
  ToastActionButton,
  ToastCloseButton,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastProvider,
  ToastQueue,
  ToastTitle,
  toast,
  toastQueue
};
export type {
  ToastActionButtonProps,
  ToastCloseButtonProps,
  ToastContentProps,
  ToastDescriptionProps,
  ToastIndicatorProps,
  ToastPlacement,
  ToastProps,
  ToastProviderProps,
  ToastTitleProps,
  ToastVariant
} from "./Toast";
export type {
  ToastContentValue,
  ToastPromiseOptions,
  ToastQueueOptions,
  ToastShowOptions
} from "./ToastQueue";
