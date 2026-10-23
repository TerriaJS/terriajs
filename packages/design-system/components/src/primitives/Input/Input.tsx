import { forwardRef } from "react";
import {
  Input as AriaInput,
  type InputProps as AriaInputProps
} from "react-aria-components/Input";
import "./Input.css";

type InputVariant = "primary" | "secondary";

type InputProps = AriaInputProps & {
  variant?: InputVariant;
  fullWidth?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
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

export { Input };
export type { InputVariant, InputProps };
