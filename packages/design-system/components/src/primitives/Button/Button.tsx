import { forwardRef } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import "./Button.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "danger"
  | "danger-soft";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isIconOnly?: boolean;
  fullWidth?: boolean;
} & AriaButtonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", isIconOnly, fullWidth, ...props },
    ref
  ) => {
    return (
      <AriaButton
        ref={ref}
        {...props}
        data-tds="button"
        data-tds-variant={variant}
        data-tds-size={size}
        data-tds-icon-only={isIconOnly ? true : undefined}
        data-tds-full-width={fullWidth ? true : undefined}
      />
    );
  }
);

Button.displayName = "Button";
