import { forwardRef } from "react";
import {
  Input as AriaInput,
  type InputProps as AriaInputProps
} from "react-aria-components/Input";
import "./Input.css";

export type InputVariant = "primary" | "secondary";

export type InputProps = AriaInputProps & {
  variant?: InputVariant;
  fullWidth?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ children: _children, variant = "primary", fullWidth, ...props }, ref) => {
    return (
      <AriaInput
        {...props}
        ref={ref}
        data-tds="input"
        data-tds-variant={variant}
        data-tds-full-width={fullWidth ? true : undefined}
      />
    );
  }
);
Input.displayName = "Input";
