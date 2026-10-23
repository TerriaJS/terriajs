import { forwardRef } from "react";
import {
  TextArea as AriaTextArea,
  type TextAreaProps as AriaTextAreaProps
} from "react-aria-components/TextArea";
import type { InputVariant } from "../Input";
import "../Input/Input.css";
import "./TextArea.css";

type TextAreaProps = AriaTextAreaProps & {
  variant?: InputVariant;
  fullWidth?: boolean;
};

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ variant = "primary", fullWidth, ...props }, ref) => {
    return (
      <AriaTextArea
        {...props}
        ref={ref}
        data-tds="textarea"
        data-tds-variant={variant}
        data-tds-full-width={fullWidth ? true : undefined}
      />
    );
  }
);
TextArea.displayName = "TextArea";

export { TextArea };
export type { TextAreaProps };
