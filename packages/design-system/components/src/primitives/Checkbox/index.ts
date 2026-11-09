import {
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxRoot
} from "./Checkbox";

// Compound component, assembled here so Checkbox.tsx only exports components
export const CheckboxPrimitive = Object.assign(CheckboxRoot, {
  Root: CheckboxRoot,
  Content: CheckboxContent,
  Control: CheckboxControl,
  Indicator: CheckboxIndicator
});

export {
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxRoot
};
export type {
  CheckboxProps,
  CheckboxContentProps,
  CheckboxControlProps,
  CheckboxIndicatorProps,
  CheckboxRootProps as CheckboxPrimitiveProps,
  CheckboxVariant
} from "./Checkbox";
