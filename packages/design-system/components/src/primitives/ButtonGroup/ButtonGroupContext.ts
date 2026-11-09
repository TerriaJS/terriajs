import { createContext } from "react";
import type { ButtonSize, ButtonVariant } from "../Button/Button";

export type ButtonGroupContextValue = {
  size?: ButtonSize | undefined;
  variant?: ButtonVariant | undefined;
  isDisabled?: boolean | undefined;
  fullWidth?: boolean | undefined;
};

// What a ButtonGroup hands its buttons; a button's own props win
export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(
  null
);
