import {
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
  NumberFieldRoot
} from "./NumberField";

// Compound component, assembled here so NumberField.tsx only exports components
export const NumberField = Object.assign(NumberFieldRoot, {
  Root: NumberFieldRoot,
  Group: NumberFieldGroup,
  Input: NumberFieldInput,
  DecrementButton: NumberFieldDecrementButton,
  IncrementButton: NumberFieldIncrementButton
});

export {
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
  NumberFieldRoot
};
export type {
  NumberFieldButtonProps,
  NumberFieldGroupProps,
  NumberFieldProps
} from "./NumberField";
