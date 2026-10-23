import { MinusIcon, PlusIcon } from "@terria/design-system-icons";
import { forwardRef } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import {
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps
} from "react-aria-components/NumberField";
import {
  InputGroupInput,
  InputGroupRoot,
  type InputGroupProps
} from "../InputGroup";
import "../Field/Field.css";
import "./NumberField.css";

type NumberFieldProps = AriaNumberFieldProps & {
  /** Fill the container's width; otherwise the field hugs its group */
  fullWidth?: boolean;
};

// Stacks a Label, the Group with its Input and buttons, and a Description or
// FieldError, as a TextField does
const NumberFieldRoot = forwardRef<HTMLDivElement, NumberFieldProps>(
  ({ fullWidth, ...props }, ref) => {
    return (
      <AriaNumberField
        {...props}
        ref={ref}
        data-tds="number-field"
        data-tds-full-width={fullWidth ? true : undefined}
      />
    );
  }
);

NumberFieldRoot.displayName = "NumberField";

type NumberFieldGroupProps = InputGroupProps;

// An InputGroup, divided unless set otherwise; the field sets its invalid and
// disabled states
const NumberFieldGroup = forwardRef<HTMLDivElement, NumberFieldGroupProps>(
  ({ isDivided = true, ...props }, ref) => {
    return <InputGroupRoot {...props} ref={ref} isDivided={isDivided} />;
  }
);

NumberFieldGroup.displayName = "NumberField.Group";

type NumberFieldButtonProps = Omit<AriaButtonProps, "slot">;

// Steps the value down; named "Decrease" for screen readers
const NumberFieldDecrementButton = forwardRef<
  HTMLButtonElement,
  NumberFieldButtonProps
>(({ children, ...props }, ref) => {
  return (
    <AriaButton
      {...props}
      ref={ref}
      slot="decrement"
      data-tds="number-field-button"
    >
      {children ?? <MinusIcon aria-hidden size={16} />}
    </AriaButton>
  );
});

NumberFieldDecrementButton.displayName = "NumberField.DecrementButton";

// Steps the value up; named "Increase" for screen readers
const NumberFieldIncrementButton = forwardRef<
  HTMLButtonElement,
  NumberFieldButtonProps
>(({ children, ...props }, ref) => {
  return (
    <AriaButton
      {...props}
      ref={ref}
      slot="increment"
      data-tds="number-field-button"
    >
      {children ?? <PlusIcon aria-hidden size={16} />}
    </AriaButton>
  );
});

NumberFieldIncrementButton.displayName = "NumberField.IncrementButton";

export {
  NumberFieldRoot,
  NumberFieldGroup,
  InputGroupInput as NumberFieldInput,
  NumberFieldDecrementButton,
  NumberFieldIncrementButton
};
export type { NumberFieldProps, NumberFieldGroupProps, NumberFieldButtonProps };
