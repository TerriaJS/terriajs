import { forwardRef, useContext } from "react";
import {
  ColorField as AriaColorField,
  ColorFieldStateContext,
  parseColor,
  type ColorFieldProps as AriaColorFieldProps
} from "react-aria-components/ColorField";
import { ColorSwatch, type ColorSwatchProps } from "../ColorSwatch";
import {
  InputGroupInput,
  InputGroupRoot,
  type InputGroupProps
} from "../InputGroup";
import "../Field/Field.css";
import "./ColorField.css";

type ColorFieldProps = AriaColorFieldProps & {
  /** Fill the container's width; otherwise the field hugs its group */
  fullWidth?: boolean;
};

// Stacks a Label, the Group with its swatch and input, and a Description or
// FieldError, as a TextField does. The colour is typed as hex, and taken as
// the field is left. In a ColorPicker, it changes the picker's colour
const ColorFieldRoot = forwardRef<HTMLDivElement, ColorFieldProps>(
  ({ fullWidth, ...props }, ref) => {
    return (
      <AriaColorField
        {...props}
        ref={ref}
        data-tds="color-field"
        data-tds-full-width={fullWidth ? true : undefined}
      />
    );
  }
);

ColorFieldRoot.displayName = "ColorField";

type ColorFieldGroupProps = InputGroupProps;

// An InputGroup; the field sets its invalid and disabled states
const ColorFieldGroup = forwardRef<HTMLDivElement, ColorFieldGroupProps>(
  (props, ref) => {
    return <InputGroupRoot {...props} ref={ref} />;
  }
);

ColorFieldGroup.displayName = "ColorField.Group";

// No colour, while the field is empty or what's typed isn't one
const NO_COLOR = parseColor("rgba(0, 0, 0, 0)");

type ColorFieldSwatchProps = Omit<ColorSwatchProps, "color">;

// The colour as typed, at the start of the group; empty, the checkerboard
// alone. In a ColorPicker, put it in ColorPicker.Trigger to open the picker
// from it
const ColorFieldSwatch = forwardRef<HTMLDivElement, ColorFieldSwatchProps>(
  (props, ref) => {
    const state = useContext(ColorFieldStateContext);
    return (
      <ColorSwatch
        size="xs"
        {...props}
        ref={ref}
        color={state?.colorValue ?? NO_COLOR}
      />
    );
  }
);

ColorFieldSwatch.displayName = "ColorField.Swatch";

export {
  ColorFieldRoot,
  ColorFieldGroup,
  ColorFieldSwatch,
  InputGroupInput as ColorFieldInput
};
export type { ColorFieldProps, ColorFieldGroupProps, ColorFieldSwatchProps };
