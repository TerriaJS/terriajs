import {
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps
} from "react-aria-components/RadioGroup";
import "../CheckboxGroup/CheckboxGroup.css";

export type RadioGroupVariant = "primary" | "secondary";

export type RadioGroupProps = AriaRadioGroupProps & {
  variant?: RadioGroupVariant;
};

// Stacks a Label, a Description, its Radios and a FieldError
export const RadioGroup = ({
  orientation = "vertical",
  variant = "primary",
  ...props
}: RadioGroupProps): React.ReactElement => {
  return (
    <AriaRadioGroup
      {...props}
      orientation={orientation}
      data-tds="radio-group"
      data-tds-orientation={orientation}
      data-tds-variant={variant}
    />
  );
};

RadioGroup.displayName = "RadioGroup";
