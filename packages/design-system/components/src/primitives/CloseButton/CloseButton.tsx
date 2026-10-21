import { X } from "lucide-react";
import { forwardRef } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import "./CloseButton.css";

export type CloseButtonProps = AriaButtonProps;

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ "aria-label": ariaLabel = "Close", children, ...props }, ref) => (
    <AriaButton
      ref={ref}
      {...props}
      aria-label={ariaLabel}
      data-tds="close-button"
    >
      {children ?? <X aria-hidden />}
    </AriaButton>
  )
);

CloseButton.displayName = "CloseButton";
