import { XIcon } from "@terria/design-system-icons";
import { forwardRef } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import "./CloseButton.css";

type CloseButtonProps = AriaButtonProps;

const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ "aria-label": ariaLabel = "Close", children, ...props }, ref) => (
    <AriaButton
      ref={ref}
      {...props}
      aria-label={ariaLabel}
      data-tds="close-button"
    >
      {children ?? <XIcon aria-hidden />}
    </AriaButton>
  )
);

CloseButton.displayName = "CloseButton";

export { CloseButton };
export type { CloseButtonProps };
