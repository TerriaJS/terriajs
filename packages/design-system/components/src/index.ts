/**
 * @terria/design-system-components
 *
 * A collection of accessible, customizable React components built with React Aria Components.
 * All components use CSS @layer for predictable styling and can be easily themed.
 */
// Export components
export { Button } from "./primitives/Button";
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize
} from "./primitives/Button";

export {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
  PopoverRoot,
  PopoverTrigger
} from "./primitives/Popover";
export type {
  PopoverArrowProps,
  PopoverContentProps,
  PopoverDialogProps,
  PopoverHeadingProps,
  PopoverProps,
  PopoverTriggerProps
} from "./primitives/Popover";

export { Input } from "./primitives/Input";
export type { InputProps, InputVariant } from "./primitives/Input";

export { TextArea } from "./primitives/TextArea";
export type { TextAreaProps } from "./primitives/TextArea";

export { Description, FieldError, Label, TextField } from "./primitives/Field";
export type {
  DescriptionProps,
  FieldErrorProps,
  LabelProps,
  TextFieldProps
} from "./primitives/Field";

export {
  ProgressCircle,
  ProgressCircleFillCircle,
  ProgressCircleRoot,
  ProgressCircleTrack,
  ProgressCircleTrackCircle
} from "./primitives/ProgressCircle";
export type {
  ProgressCircleColor,
  ProgressCircleProps,
  ProgressCircleSize
} from "./primitives/ProgressCircle";
