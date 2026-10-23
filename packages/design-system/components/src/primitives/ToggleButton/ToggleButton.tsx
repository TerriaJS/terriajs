import { forwardRef, useContext } from "react";
import {
  ToggleButton as AriaToggleButton,
  type ToggleButtonProps as AriaToggleButtonProps
} from "react-aria-components/ToggleButton";
import type { ButtonSize } from "../Button/Button";
import "../Button/Button.css";
import { ButtonGroupContext } from "../ButtonGroup/ButtonGroupContext";
import "./ToggleButton.css";

type ToggleButtonVariant = "default" | "ghost";

type ToggleButtonProps = AriaToggleButtonProps & {
  variant?: ToggleButtonVariant;
  size?: ButtonSize;
  isIconOnly?: boolean;
  fullWidth?: boolean;
};

// The Button look each variant takes when off: the design's filled default is
// Button's tertiary
const BUTTON_VARIANTS = {
  default: "tertiary",
  ghost: "ghost"
} as const satisfies Record<ToggleButtonVariant, string>;

// A button that stays on until it's pressed again. It's styled as a Button,
// so it takes Button's sizes and states; when on, it's the soft accent
const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (
    {
      variant = "default",
      size: sizeProp,
      isIconOnly,
      fullWidth: fullWidthProp,
      isDisabled,
      ...props
    },
    ref
  ) => {
    // Inside a ToggleButtonGroup, unset props come from the group
    const group = useContext(ButtonGroupContext);
    const fullWidth = fullWidthProp ?? group?.fullWidth;

    return (
      <AriaToggleButton
        ref={ref}
        {...props}
        isDisabled={isDisabled ?? group?.isDisabled}
        data-tds="button"
        data-tds-toggle
        data-tds-variant={BUTTON_VARIANTS[variant]}
        data-tds-size={sizeProp ?? group?.size ?? "md"}
        data-tds-icon-only={isIconOnly ? true : undefined}
        data-tds-full-width={fullWidth ? true : undefined}
      />
    );
  }
);

ToggleButton.displayName = "ToggleButton";

export { ToggleButton };
export type { ToggleButtonVariant, ToggleButtonProps };
