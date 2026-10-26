import {
  ColorFieldGroup,
  ColorFieldInput,
  ColorFieldRoot,
  ColorFieldSwatch
} from "./ColorField";

// Compound component, assembled here so ColorField.tsx only exports
// components
export const ColorField = Object.assign(ColorFieldRoot, {
  Root: ColorFieldRoot,
  Group: ColorFieldGroup,
  Swatch: ColorFieldSwatch,
  Input: ColorFieldInput
});

export { ColorFieldGroup, ColorFieldInput, ColorFieldRoot, ColorFieldSwatch };
export type {
  ColorFieldGroupProps,
  ColorFieldProps,
  ColorFieldSwatchProps
} from "./ColorField";
