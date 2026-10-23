import { forwardRef, type ComponentPropsWithoutRef } from "react";
import {
  Group as AriaGroup,
  type GroupProps as AriaGroupProps
} from "react-aria-components/Group";
import {
  Input as AriaInput,
  type InputProps as AriaInputProps
} from "react-aria-components/Input";
import {
  TextArea as AriaTextArea,
  type TextAreaProps as AriaTextAreaProps
} from "react-aria-components/TextArea";
import type { InputVariant } from "../Input";
import "../Input/Input.css";
import "./InputGroup.css";

type InputGroupProps = AriaGroupProps & {
  variant?: InputVariant;
  fullWidth?: boolean;
  /** Divides the prefix and suffix from the input with a line */
  isDivided?: boolean;
  /** Vertical stacks the prefix above a TextArea and the suffix below it, as
   * rows of controls */
  orientation?: "horizontal" | "vertical";
};

// An input with a prefix, a suffix, or both, inside one field border. In a
// TextField or NumberField, the field labels the input and sets the group's
// invalid and disabled states
const InputGroupRoot = forwardRef<HTMLDivElement, InputGroupProps>(
  (
    {
      variant = "primary",
      fullWidth,
      isDivided,
      orientation = "horizontal",
      ...props
    },
    ref
  ) => {
    return (
      <AriaGroup
        {...props}
        ref={ref}
        data-tds="input-group"
        data-tds-variant={variant}
        data-tds-full-width={fullWidth ? true : undefined}
        data-tds-divided={isDivided ? true : undefined}
        data-tds-orientation={orientation}
      />
    );
  }
);

InputGroupRoot.displayName = "InputGroup";

type InputGroupInputProps = Omit<AriaInputProps, "children">;

const InputGroupInput = forwardRef<HTMLInputElement, InputGroupInputProps>(
  (props, ref) => {
    return <AriaInput {...props} ref={ref} data-tds="input-group-input" />;
  }
);

InputGroupInput.displayName = "InputGroup.Input";

type InputGroupTextAreaProps = AriaTextAreaProps;

// A multi-line input in place of InputGroup.Input; the prefix and suffix line
// up with its first line
const InputGroupTextArea = forwardRef<
  HTMLTextAreaElement,
  InputGroupTextAreaProps
>((props, ref) => {
  return <AriaTextArea {...props} ref={ref} data-tds="input-group-textarea" />;
});

InputGroupTextArea.displayName = "InputGroup.TextArea";

type InputGroupAffixProps = ComponentPropsWithoutRef<"span">;

// Text, an icon, or a control before the input
const InputGroupPrefix = forwardRef<HTMLSpanElement, InputGroupAffixProps>(
  (props, ref) => {
    return <span {...props} ref={ref} data-tds="input-group-prefix" />;
  }
);

InputGroupPrefix.displayName = "InputGroup.Prefix";

// Text, an icon, or a control after the input
const InputGroupSuffix = forwardRef<HTMLSpanElement, InputGroupAffixProps>(
  (props, ref) => {
    return <span {...props} ref={ref} data-tds="input-group-suffix" />;
  }
);

InputGroupSuffix.displayName = "InputGroup.Suffix";

export {
  InputGroupRoot,
  InputGroupInput,
  InputGroupTextArea,
  InputGroupPrefix,
  InputGroupSuffix
};
export type {
  InputGroupProps,
  InputGroupInputProps,
  InputGroupTextAreaProps,
  InputGroupAffixProps
};
