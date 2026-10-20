import {
  FieldError as AriaFieldError,
  type FieldErrorProps as AriaFieldErrorProps
} from "react-aria-components/FieldError";
import {
  Label as AriaLabel,
  type LabelProps as AriaLabelProps
} from "react-aria-components/Label";
import { Text, type TextProps } from "react-aria-components/Text";
import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps
} from "react-aria-components/TextField";
import "./Field.css";

export type LabelProps = AriaLabelProps;

export const Label = (props: LabelProps): React.ReactElement => {
  return <AriaLabel {...props} data-tds="label" />;
};

Label.displayName = "Label";

export type DescriptionProps = Omit<TextProps, "slot">;

export const Description = (props: DescriptionProps): React.ReactElement => {
  return <Text {...props} slot="description" data-tds="description" />;
};

Description.displayName = "Description";

export type FieldErrorProps = AriaFieldErrorProps;

export const FieldError = (props: FieldErrorProps): React.ReactElement => {
  return <AriaFieldError {...props} data-tds="field-error" />;
};

FieldError.displayName = "FieldError";

export type TextFieldProps = AriaTextFieldProps;

// Stacks a Label, an Input or TextArea, and a Description or FieldError
export const TextField = (props: TextFieldProps): React.ReactElement => {
  return <AriaTextField {...props} data-tds="text-field" />;
};

TextField.displayName = "TextField";
