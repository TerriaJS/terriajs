import { useMemo } from "react";
import {
  CheckboxGroup as AriaCheckboxGroup,
  type CheckboxGroupProps as AriaCheckboxGroupProps
} from "react-aria-components/CheckboxGroup";
import type { CheckboxVariant } from "../Checkbox";
import { CheckboxGroupContext } from "./CheckboxGroupContext";
import "./CheckboxGroup.css";

type CheckboxGroupOrientation = "vertical" | "horizontal";

type CheckboxGroupProps = AriaCheckboxGroupProps & {
  orientation?: CheckboxGroupOrientation;
  /** The variant of checkboxes that don't set their own */
  variant?: CheckboxVariant;
};

// Stacks a Label, a Description, its Checkboxes and a FieldError
const CheckboxGroup = ({
  orientation = "vertical",
  variant,
  ...props
}: CheckboxGroupProps): React.ReactElement => {
  const context = useMemo(() => ({ variant }), [variant]);

  return (
    <CheckboxGroupContext.Provider value={context}>
      <AriaCheckboxGroup
        {...props}
        data-tds="checkbox-group"
        data-tds-orientation={orientation}
      />
    </CheckboxGroupContext.Provider>
  );
};

CheckboxGroup.displayName = "CheckboxGroup";

export { CheckboxGroup };
export type { CheckboxGroupOrientation, CheckboxGroupProps };
