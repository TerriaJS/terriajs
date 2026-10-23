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

type LabelProps = AriaLabelProps;

const Label = (props: LabelProps): React.ReactElement => {
  return <AriaLabel {...props} data-tds="label" />;
};

Label.displayName = "Label";

type DescriptionProps = Omit<TextProps, "slot">;

const Description = (props: DescriptionProps): React.ReactElement => {
  return <Text {...props} slot="description" data-tds="description" />;
};

Description.displayName = "Description";

type FieldErrorProps = AriaFieldErrorProps;

const FieldError = (props: FieldErrorProps): React.ReactElement => {
  return <AriaFieldError {...props} data-tds="field-error" />;
};

FieldError.displayName = "FieldError";

type TextFieldProps = AriaTextFieldProps & {
  /** Fill the container's width; otherwise the field hugs its input */
  fullWidth?: boolean;
};

// Stacks a Label, an Input or TextArea, and a Description or FieldError
const TextField = ({
  fullWidth,
  ...props
}: TextFieldProps): React.ReactElement => {
  return (
    <AriaTextField
      {...props}
      data-tds="text-field"
      data-tds-full-width={fullWidth ? true : undefined}
    />
  );
};

TextField.displayName = "TextField";

export { Label, Description, FieldError, TextField };
export type { LabelProps, DescriptionProps, FieldErrorProps, TextFieldProps };
