import { XIcon } from "@terria/design-system-icons";
import { forwardRef } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import "./CloseButton.css";
import { useLocalizedStrings } from "../../i18n/useLocalizedStrings";

type CloseButtonProps = AriaButtonProps;

const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ "aria-label": ariaLabel, children, ...props }, ref) => {
    const strings = useLocalizedStrings();

    return (
      <AriaButton
        ref={ref}
        {...props}
        aria-label={ariaLabel ?? strings.format("closeButton.label")}
        data-tds="close-button"
      >
        {children ?? <XIcon aria-hidden />}
      </AriaButton>
    );
  }
);

CloseButton.displayName = "CloseButton";

export { CloseButton };
export type { CloseButtonProps };
