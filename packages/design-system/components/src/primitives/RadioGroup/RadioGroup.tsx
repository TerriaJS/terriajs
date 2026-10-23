import {
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps
} from "react-aria-components/RadioGroup";
import "../CheckboxGroup/CheckboxGroup.css";

type RadioGroupVariant = "primary" | "secondary";

type RadioGroupProps = AriaRadioGroupProps & {
  variant?: RadioGroupVariant;
};

// Stacks a Label, a Description, its Radios and a FieldError
const RadioGroup = ({
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

export { RadioGroup };
export type { RadioGroupVariant, RadioGroupProps };
